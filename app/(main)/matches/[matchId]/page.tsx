import Link from 'next/link'
import { cookies } from 'next/headers'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { MatchDetailClient } from './MatchDetailClient'
import { getMapsStats } from '@/lib/types/evidence'
import { getFocusTeam } from '@/lib/focusTeam'
import { normalizeTeamName } from '@/lib/teamUtils'
import { getTournamentMeta } from '@/lib/tournaments'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ matchId: string }> }
type ProjectedMatch = Pick<MatchDocument, '_id' | 'gridSeriesId' | 'tournamentId' | 'analytics'>

export default async function MatchDetailPage({ params }: Props) {
  // await requireAuth()
  const { matchId } = await params
  const focusTeam = getFocusTeam(await cookies())
  await connectToDB()

  const match = (await Match.findById(matchId, {
    _id: 1,
    gridSeriesId: 1,
    tournamentId: 1,
    'analytics.evidence_v1': 1,
  }).lean()) as unknown as ProjectedMatch | null

  if (!match) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-lg">Match not found.</p>
            <Link href="/matches" className="text-[#00aeef] hover:text-[#00c8ff] mt-4 inline-block">
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
            <Link href="/matches" className="text-[#00aeef] hover:text-[#00c8ff] mt-4 inline-block">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Extract series data
  const games = evidence.games || []
  const players = evidence.players || []
  const mapsStats = getMapsStats(evidence)

  if (!mapsStats.some((stat) => stat.teamId === focusTeam.teamId)) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-lg">
              {focusTeam.teamName} did not play in this match.
            </p>
            <Link href="/matches" className="text-[#00aeef] hover:text-[#00c8ff] mt-4 inline-block">
              ← Back to matches
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Find opponent name and normalize it (removes "(1)" suffixes)
  const opponentStat = mapsStats.find(
    (stat) => stat.teamId !== focusTeam.teamId && stat.teamName
  )
  const opponentTeamId = opponentStat?.teamId || ''
  const opponentName = opponentStat?.teamName
    ? normalizeTeamName(opponentStat.teamName)
    : 'Unknown'

  // Build game data with scores
  const gameStats = new Map<string, { c9: number; opp: number }>()
  for (const stat of mapsStats) {
    const gameId = stat.gameId
    if (!gameStats.has(gameId)) {
      gameStats.set(gameId, { c9: 0, opp: 0 })
    }
    if (stat.teamId === focusTeam.teamId) {
      gameStats.get(gameId)!.c9 = stat.roundsWon
    } else if (stat.teamId === opponentTeamId) {
      gameStats.get(gameId)!.opp = stat.roundsWon
    }
  }

  const gamesWithScores = games.map((game) => {
    const stats = gameStats.get(game.gameId) || { c9: 0, opp: 0 }
    return {
      gameId: game.gameId,
      mapName: game.mapName,
      sequenceNumber: game.sequenceNumber,
      c9Rounds: stats.c9,
      opponentRounds: stats.opp,
      c9Won: stats.c9 > stats.opp,
    }
  }).sort((a, b) => a.sequenceNumber - b.sequenceNumber)

  // Calculate series score
  const c9MapsWon = gamesWithScores.filter((g) => g.c9Won).length
  const opponentMapsWon = gamesWithScores.filter((g) => !g.c9Won).length
  const seriesWon = c9MapsWon > opponentMapsWon

  // Get player stats per game - compute from kills array
  const kills = evidence.kills || []
  const playerStatsByGame: Record<string, Array<{
    playerId: string
    playerName: string
    teamId: string
    kills: number
    deaths: number
    kd: number
  }>> = {}

  for (const game of games) {
    const gameKills = kills.filter((k) => k.gameId === game.gameId)

    // Build per-map stats from kills
    const playerStatsMap = new Map<string, { playerId: string, playerName: string, teamId: string, kills: number, deaths: number }>()

    for (const kill of gameKills) {
      // Count kills for killer
      if (kill.killerId && kill.killerTeamId === focusTeam.teamId) {
        if (!playerStatsMap.has(kill.killerId)) {
          playerStatsMap.set(kill.killerId, { playerId: kill.killerId, playerName: '', teamId: kill.killerTeamId, kills: 0, deaths: 0 })
        }
        playerStatsMap.get(kill.killerId)!.kills++
      }
      // Count deaths for victim
      if (kill.victimId && kill.victimTeamId === focusTeam.teamId) {
        if (!playerStatsMap.has(kill.victimId)) {
          playerStatsMap.set(kill.victimId, { playerId: kill.victimId, playerName: '', teamId: kill.victimTeamId, kills: 0, deaths: 0 })
        }
        playerStatsMap.get(kill.victimId)!.deaths++
      }
    }

    // Populate player names from evidence.players
    playerStatsMap.forEach((stats, playerId) => {
      const p = players.find((pl) => pl.playerId === playerId)
      if (p) stats.playerName = p.playerName || `Player ${playerId}`
    })

    playerStatsByGame[game.gameId] = Array.from(playerStatsMap.values())
      .map(s => ({ ...s, kd: s.deaths > 0 ? s.kills / s.deaths : s.kills }))
  }

  // Serialize the data for client component
  const seriesId = match.gridSeriesId || ''
  const tournamentMeta = getTournamentMeta(match.tournamentId)
  const seriesData = {
    matchId: String(match._id),
    seriesId,
    focusTeamId: focusTeam.teamId,
    focusTeamName: focusTeam.teamName,
    opponentName,
    tournamentName: tournamentMeta?.label ?? 'VCT Americas',
    matchDate: tournamentMeta?.month ?? '2024',
    c9MapsWon,
    opponentMapsWon,
    seriesWon,
    games: gamesWithScores,
    playerStatsByGame,
  }

  return <MatchDetailClient seriesData={seriesData} />
}
