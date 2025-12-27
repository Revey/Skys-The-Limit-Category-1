import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { generateCoachingReport } from '@/lib/ai/coach'

// Increase timeout for LLM calls (Vercel default is 10s, we need more for Gemini)
export const maxDuration = 60 // 60 seconds max

/**
 * GET /api/coach/match
 * Fetch match data with evidence_v1
 * Query params: matchId or seriesId
 */
export async function GET(req: NextRequest) {
  await requireAuth()
  await connectToDB()

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const seriesId = searchParams.get('seriesId')

  if (!matchId && !seriesId) {
    return NextResponse.json(
      { error: 'Either matchId or seriesId is required' },
      { status: 400 }
    )
  }

  let match: MatchDocument | null = null

  try {
    if (matchId) {
      match = (await Match.findById(matchId).lean()) as MatchDocument | null
    } else if (seriesId) {
      match = (await Match.findOne({ gridSeriesId: seriesId }).lean()) as MatchDocument | null
    }

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Build response with evidence
    const response = {
      matchId: match._id.toString(),
      meta: {
        seriesId: match.gridSeriesId || '',
        tournamentId: match.tournamentId || '',
        map: match.map,
        opponentName: match.opponentName,
        eventName: match.eventName,
        date: match.date,
        games: match.analytics?.evidence_v1?.games || [],
      },
      evidence: match.analytics?.evidence_v1 || null,
      evidenceMeta: match.analytics?.evidence_v1_meta || null,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Failed to fetch match', err)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}

/**
 * Filter evidence data to only include a specific game/map
 */
function filterEvidenceByGame(evidence: any, gameId: string): any {
  if (!evidence || !gameId) return evidence

  const game = evidence.games?.find((g: any) => g.gameId === gameId)
  if (!game) return evidence

  // Filter all arrays by gameId
  const filteredRounds = evidence.rounds?.filter((r: any) => r.gameId === gameId) || []
  const filteredKills = evidence.kills?.filter((k: any) => k.gameId === gameId) || []
  const filteredPlants = evidence.plants?.filter((p: any) => p.gameId === gameId) || []
  const filteredDefuses = evidence.defuses?.filter((d: any) => d.gameId === gameId) || []
  const filteredClutches = evidence.clutchSituations?.filter((c: any) => c.gameId === gameId) || []
  const filteredEconomy = evidence.economyRounds?.filter((e: any) => e.gameId === gameId) || []
  const filteredAbilities = evidence.abilityUses?.filter((a: any) => a.gameId === gameId) || []

  // Recompute player stats for this game only
  const playerStatsMap = new Map<string, any>()
  
  // Initialize from evidence players
  evidence.players?.forEach((p: any) => {
    playerStatsMap.set(p.playerId, {
      ...p,
      kills: 0,
      deaths: 0,
      firstBloods: 0,
      firstDeaths: 0,
      isolatedDeathsCount: 0
    })
  })

  // Count from filtered kills
  filteredKills.forEach((kill: any) => {
    if (kill.killerId && playerStatsMap.has(kill.killerId)) {
      const player = playerStatsMap.get(kill.killerId)
      player.kills++
    }
    if (kill.victimId && playerStatsMap.has(kill.victimId)) {
      const player = playerStatsMap.get(kill.victimId)
      player.deaths++
      if (kill.isIsolated) {
        player.isolatedDeathsCount++
      }
    }
    if (kill.isFirstBlood) {
      if (kill.killerId && playerStatsMap.has(kill.killerId)) {
        playerStatsMap.get(kill.killerId).firstBloods++
      }
      if (kill.victimId && playerStatsMap.has(kill.victimId)) {
        playerStatsMap.get(kill.victimId).firstDeaths++
      }
    }
  })

  const filteredPlayers = Array.from(playerStatsMap.values())
    .filter(p => p.kills > 0 || p.deaths > 0)
    .map(p => ({
      ...p,
      kd: p.deaths > 0 ? p.kills / p.deaths : p.kills
    }))

  // Recompute derived stats for this game
  const teamFBStats = new Map<string, { firstBloods: number; roundsWon: number; teamName: string; teamId: string }>()
  
  filteredRounds.forEach((round: any) => {
    const fb = round.firstBlood
    if (fb?.killerTeamId) {
      if (!teamFBStats.has(fb.killerTeamId)) {
        // Try to get team name from mapsStats
        const teamInfo = evidence.derived?.mapsStats?.find((s: any) => s.teamId === fb.killerTeamId)
        teamFBStats.set(fb.killerTeamId, { 
          firstBloods: 0, 
          roundsWon: 0, 
          teamName: teamInfo?.teamName || `Team ${fb.killerTeamId}`,
          teamId: fb.killerTeamId
        })
      }
      teamFBStats.get(fb.killerTeamId)!.firstBloods++
      
      if (round.winnerTeamId === fb.killerTeamId) {
        teamFBStats.get(fb.killerTeamId)!.roundsWon++
      }
    }
  })

  const filteredFirstBloodStats = Array.from(teamFBStats.values()).map(stats => ({
    teamId: stats.teamId,
    teamName: stats.teamName,
    firstBloods: stats.firstBloods,
    roundsWon: stats.roundsWon,
    conversionRate: stats.firstBloods > 0 ? stats.roundsWon / stats.firstBloods : 0
  }))

  // Compute plant stats
  const teamPlantStats = new Map<string, { plants: number; postPlantWins: number; teamName: string; teamId: string }>()
  
  filteredPlants.forEach((plant: any) => {
    const teamId = plant.planterTeamId
    if (!teamId) return
    
    if (!teamPlantStats.has(teamId)) {
      const teamInfo = evidence.derived?.mapsStats?.find((s: any) => s.teamId === teamId)
      teamPlantStats.set(teamId, { 
        plants: 0, 
        postPlantWins: 0, 
        teamName: teamInfo?.teamName || `Team ${teamId}`,
        teamId
      })
    }
    teamPlantStats.get(teamId)!.plants++
    
    const round = filteredRounds.find((r: any) => r.roundNumber === plant.roundNumber)
    if (round?.winnerTeamId === teamId) {
      teamPlantStats.get(teamId)!.postPlantWins++
    }
  })

  const filteredPlantStats = Array.from(teamPlantStats.values()).map(stats => ({
    teamId: stats.teamId,
    teamName: stats.teamName,
    plants: stats.plants,
    postPlantWins: stats.postPlantWins,
    postPlantWinRate: stats.plants > 0 ? stats.postPlantWins / stats.plants : 0
  }))

  // Compute site stats
  const siteStatsMap = new Map<string, { plants: number; postPlantWins: number }>()
  
  filteredPlants.forEach((plant: any) => {
    const site = plant.site
    if (!site || site === 'unknown') return
    
    if (!siteStatsMap.has(site)) {
      siteStatsMap.set(site, { plants: 0, postPlantWins: 0 })
    }
    siteStatsMap.get(site)!.plants++
    
    const round = filteredRounds.find((r: any) => r.roundNumber === plant.roundNumber)
    if (round?.winnerTeamId === plant.planterTeamId) {
      siteStatsMap.get(site)!.postPlantWins++
    }
  })

  const filteredSiteStats = Array.from(siteStatsMap.entries()).map(([site, stats]) => ({
    site,
    plants: stats.plants,
    postPlantWins: stats.postPlantWins,
    postPlantWinRate: stats.plants > 0 ? stats.postPlantWins / stats.plants : 0
  })).sort((a, b) => a.site.localeCompare(b.site))

  // Filter mapsStats for this game only
  const filteredMapsStats = evidence.derived?.mapsStats?.filter((s: any) => s.gameId === gameId) || []

  return {
    ...evidence,
    games: [game],
    rounds: filteredRounds,
    kills: filteredKills,
    plants: filteredPlants,
    defuses: filteredDefuses,
    clutchSituations: filteredClutches,
    economyRounds: filteredEconomy,
    abilityUses: filteredAbilities,
    players: filteredPlayers,
    agentCompositions: evidence.agentCompositions?.[gameId] 
      ? { [gameId]: evidence.agentCompositions[gameId] } 
      : {},
    derived: {
      ...evidence.derived,
      mapsStats: filteredMapsStats,
      firstBloodStats: filteredFirstBloodStats,
      plantStats: filteredPlantStats,
      siteStats: filteredSiteStats,
    },
    meta: {
      ...evidence.meta,
      filteredForGame: gameId,
      mapName: game.mapName
    }
  }
}

/**
 * POST /api/coach/match
 * Generate coaching report for a match (optionally per-map)
 * Body: { matchId: string, gameId?: string }
 */
export async function POST(req: NextRequest) {
  await requireAuth()
  await connectToDB()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const matchId = (body as Record<string, unknown>)?.matchId as string | undefined
  const gameId = (body as Record<string, unknown>)?.gameId as string | undefined
  
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
  }

  const match = (await Match.findById(matchId).lean()) as MatchDocument | null
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  let analytics
  try {
    analytics = computeMatchAnalytics(match)
  } catch (err) {
    console.error('Failed to compute analytics for match', matchId, err)
    return NextResponse.json(
      { error: 'Failed to compute analytics' },
      { status: 500 }
    )
  }

  try {
    // Get evidence and optionally filter by gameId
    let evidence = match.analytics?.evidence_v1 || null
    
    if (evidence && gameId) {
      // Filter evidence to only include the selected game/map
      evidence = filterEvidenceByGame(evidence, gameId)
      
      // Update analytics to reflect the specific map
      const game = evidence.games?.[0]
      if (game) {
        analytics.map = game.mapName
        
        // Update round stats from filtered data
        const c9Stats = evidence.derived?.mapsStats?.find((s: any) => s.teamId === '79')
        const oppStats = evidence.derived?.mapsStats?.find((s: any) => s.teamId !== '79')
        
        if (c9Stats) {
          analytics.teamRoundsWon = c9Stats.roundsWon
        }
        if (oppStats) {
          analytics.teamRoundsLost = oppStats.roundsWon
          analytics.opponentName = oppStats.teamName
        }
        analytics.roundsPlayed = (analytics.teamRoundsWon || 0) + (analytics.teamRoundsLost || 0)
      }
    }
    
    const report = await generateCoachingReport(analytics, evidence)
    return NextResponse.json({ report })
  } catch (err) {
    console.error('Failed to generate coaching report', err)
    return NextResponse.json(
      { error: 'Failed to generate coaching report' },
      { status: 500 }
    )
  }
}
