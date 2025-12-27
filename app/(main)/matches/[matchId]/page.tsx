import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { MatchDetailClient } from './MatchDetailClient'

export const dynamic = 'force-dynamic'

const CLOUD9_TEAM_ID = '79'

type Props = { params: Promise<{ matchId: string }> }

export default async function MatchDetailPage({ params }: Props) {
  await requireAuth()
  const { matchId } = await params
  await connectToDB()

  const match = (await Match.findById(matchId).lean()) as unknown as MatchDocument | null

  if (!match) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-lg">Match not found.</p>
            <Link href="/matches" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const evidence = match.analytics?.evidence_v1
  if (!evidence) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-lg">No evidence data available for this match.</p>
            <Link href="/matches" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Extract series data
  const games = evidence.games || []
  const rounds = evidence.rounds || []
  const players = evidence.players || []
  const mapsStats = evidence.derived?.mapsStats || []

  // Find opponent name
  let opponentName = match.opponentName || 'Unknown'
  for (const stat of mapsStats) {
    if (stat.teamId !== CLOUD9_TEAM_ID && stat.teamName) {
      opponentName = stat.teamName
      break
    }
  }

  // Build game data with scores
  const gameStats = new Map<string, { c9: number; opp: number }>()
  for (const stat of mapsStats) {
    const gameId = stat.gameId
    if (!gameStats.has(gameId)) {
      gameStats.set(gameId, { c9: 0, opp: 0 })
    }
    if (stat.teamId === CLOUD9_TEAM_ID) {
      gameStats.get(gameId)!.c9 = stat.roundsWon
    } else {
      gameStats.get(gameId)!.opp = stat.roundsWon
    }
  }

  const gamesWithScores = games.map((game: any) => {
    const stats = gameStats.get(game.gameId) || { c9: 0, opp: 0 }
    return {
      gameId: game.gameId,
      mapName: game.mapName,
      sequenceNumber: game.sequenceNumber,
      c9Rounds: stats.c9,
      opponentRounds: stats.opp,
      c9Won: stats.c9 > stats.opp,
    }
  }).sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber)

  // Calculate series score
  const c9MapsWon = gamesWithScores.filter((g: any) => g.c9Won).length
  const opponentMapsWon = gamesWithScores.filter((g: any) => !g.c9Won).length
  const seriesWon = c9MapsWon > opponentMapsWon

  // Get player stats per game - compute from kills array
  const kills = evidence.kills || []
  const playerStatsByGame: Record<string, any[]> = {}

  for (const game of games) {
    const gameKills = kills.filter((k: any) => k.gameId === game.gameId)

    // Build per-map stats from kills
    const playerStatsMap = new Map<string, { playerId: string, playerName: string, teamId: string, kills: number, deaths: number }>()

    for (const kill of gameKills) {
      // Count kills for killer
      if (kill.killerId && kill.killerTeamId === CLOUD9_TEAM_ID) {
        if (!playerStatsMap.has(kill.killerId)) {
          playerStatsMap.set(kill.killerId, { playerId: kill.killerId, playerName: '', teamId: kill.killerTeamId, kills: 0, deaths: 0 })
        }
        playerStatsMap.get(kill.killerId)!.kills++
      }
      // Count deaths for victim
      if (kill.victimId && kill.victimTeamId === CLOUD9_TEAM_ID) {
        if (!playerStatsMap.has(kill.victimId)) {
          playerStatsMap.set(kill.victimId, { playerId: kill.victimId, playerName: '', teamId: kill.victimTeamId, kills: 0, deaths: 0 })
        }
        playerStatsMap.get(kill.victimId)!.deaths++
      }
    }

    // Populate player names from evidence.players
    playerStatsMap.forEach((stats, playerId) => {
      const p = players.find((pl: any) => pl.playerId === playerId)
      if (p) stats.playerName = p.playerName || `Player ${playerId}`
    })

    playerStatsByGame[game.gameId] = Array.from(playerStatsMap.values())
      .map(s => ({ ...s, kd: s.deaths > 0 ? s.kills / s.deaths : s.kills }))
  }

  // Serialize the data for client component
  const seriesData = {
    matchId: String(match._id),
    seriesId: match.gridSeriesId || '',
    opponentName,
    eventName: match.eventName || 'GRID Import',
    date: match.startTime 
      ? new Date(match.startTime).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    c9MapsWon,
    opponentMapsWon,
    seriesWon,
    games: gamesWithScores,
    playerStatsByGame,
    // Pass evidence-derived stats for each game
    derivedStats: evidence.derived || {},
  }

  return <MatchDetailClient seriesData={seriesData} />
}
