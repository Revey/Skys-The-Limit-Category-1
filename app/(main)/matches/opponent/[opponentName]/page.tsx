import Link from 'next/link'
import { cookies } from 'next/headers'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { TeamLogo } from '@/components/ui/TeamLogo'
import { normalizeTeamName } from '@/lib/teamUtils'
import { getMapsStats } from '@/lib/types/evidence'
import { getFocusTeam } from '@/lib/focusTeam'
import { aggregateTeamTendencies } from '@/lib/analytics/aggregateTeamTendencies'
import { getTeamSeriesDerived } from '@/lib/analytics/getTeamSeriesDerived'
import { OpponentDetailTabs } from '@/components/matches/OpponentDetailTabs'
import { getLeagueBenchmarks } from '@/lib/analytics/leagueBenchmarks'
import { getTournamentMeta, stageLabel, tournamentLabel } from '@/lib/tournaments'
import { getVctFilter, tournamentIdsFor } from '@/lib/vctFilter'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SeriesData {
  seriesId: string
  matchId: string
  c9MapsWon: number
  opponentMapsWon: number
  isWin: boolean
  tournament: string
  estimatedDate: string
  games: Array<{
    gameId: string
    mapName: string
    c9Rounds: number
    opponentRounds: number
    c9Won: boolean
  }>
}

type Props = { params: Promise<{ opponentName: string }> }

export default async function OpponentDetailPage({ params }: Props) {
  // await requireAuth()
  const { opponentName } = await params
  const focusTeam = getFocusTeam(await cookies())
  const vct = getVctFilter(await cookies())
  const vctIds = tournamentIdsFor(vct)
  const decodedName = decodeURIComponent(opponentName)
  
  // The URL might have the normalized name, so we need to match against both
  const normalizedSearchName = normalizeTeamName(decodedName)
  
  await connectToDB()

  const matches = (await Match.aggregate([
    {
      $match: {
        'analytics.evidence_v1.derived.mapsStats.teamId': focusTeam.teamId,
        ...(vctIds ? { tournamentId: { $in: vctIds } } : {}),
      },
    },
    {
      $project: {
        _id: 1,
        gridSeriesId: 1,
        tournamentId: 1,
        'analytics.evidence_v1.derived.mapsStats': 1,
        'analytics.evidence_v1.games': 1
      }
    },
    { $sort: { _id: -1 } }
  ])) as unknown as MatchDocument[]

  let opponentTeamId = ''
  for (const match of matches) {
    const mapsStats = getMapsStats(match.analytics?.evidence_v1)
    const matchingTeam = mapsStats.find(stat =>
      stat.teamName && normalizeTeamName(stat.teamName) === normalizedSearchName
    )
    if (matchingTeam) {
      opponentTeamId = matchingTeam.teamId
      break
    }
  }

  const leagueBenchmarks = opponentTeamId
    ? await getLeagueBenchmarks().catch(() => null)
    : null
  const opponentTendencies = opponentTeamId
    ? aggregateTeamTendencies(
      await getTeamSeriesDerived(opponentTeamId, vctIds),
      opponentTeamId
    )
    : null

  const seriesMap = new Map<string, SeriesData>()

  for (const match of matches) {
    const evidence = match.analytics?.evidence_v1
    if (!evidence) continue

    const mapsStats = getMapsStats(evidence)
    const games = evidence.games || []
    const seriesId = match.gridSeriesId

    let foundOpponent = ''
    for (const stat of mapsStats) {
      if (stat.teamId !== focusTeam.teamId && stat.teamName) {
        foundOpponent = stat.teamName
        break
      }
    }

    // Match against normalized name
    const normalizedOpponent = normalizeTeamName(foundOpponent)
    if (normalizedOpponent !== normalizedSearchName) continue
    if (seriesId && seriesMap.has(seriesId)) continue

    const gameStats = new Map<string, { c9: number; opp: number }>()
    for (const stat of mapsStats) {
      const gameId = stat.gameId
      if (!gameStats.has(gameId)) {
        gameStats.set(gameId, { c9: 0, opp: 0 })
      }
      if (stat.teamId === focusTeam.teamId) {
        gameStats.get(gameId)!.c9 = stat.roundsWon
      } else {
        gameStats.get(gameId)!.opp = stat.roundsWon
      }
    }

    const gameResults: SeriesData['games'] = []
    let c9MapsWon = 0
    let oppMapsWon = 0

    for (const game of games) {
      const stats = gameStats.get(game.gameId)
      if (!stats) continue

      const c9Won = stats.c9 > stats.opp
      if (c9Won) c9MapsWon++
      else if (stats.opp > stats.c9) oppMapsWon++

      gameResults.push({
        gameId: game.gameId,
        mapName: game.mapName,
        c9Rounds: stats.c9,
        opponentRounds: stats.opp,
        c9Won
      })
    }

    if (seriesId) {
      const tournamentMeta = getTournamentMeta(match.tournamentId)
      seriesMap.set(seriesId, {
        seriesId,
        matchId: String(match._id),
        c9MapsWon,
        opponentMapsWon: oppMapsWon,
        isWin: c9MapsWon > oppMapsWon,
        tournament: tournamentMeta?.label ?? 'VCT Americas',
        estimatedDate: tournamentMeta?.month ?? '2024',
        games: gameResults
      })
    }
  }

  // Sort by seriesId descending (most recent first)
  const series = Array.from(seriesMap.values())
    .sort((a, b) => parseInt(b.seriesId) - parseInt(a.seriesId))
  
  const totalWins = series.filter(s => s.isWin).length
  const totalLosses = series.filter(s => !s.isWin).length
  const winRate = series.length > 0 ? ((totalWins / series.length) * 100).toFixed(0) : '0'
  const activeFilterLabel = vct.year !== 'all' && vct.stage !== 'all'
    ? (vctIds?.[0]
      ? tournamentLabel(vctIds[0])
      : `VCT ${vct.year} Americas ${stageLabel(vct.stage)}`)
    : vct.year !== 'all'
      ? `VCT ${vct.year} Americas`
      : vct.stage !== 'all'
        ? `${tournamentLabel()} ${stageLabel(vct.stage)}`
        : tournamentLabel()

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <Link 
          href="/matches" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors animate-fade-in"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to opponents
        </Link>

        {/* Header */}
        <header className="card p-6 animate-fade-in-up">
          <div className="flex items-center gap-6">
            <TeamLogo teamName={normalizedSearchName} size="xl" />
            <div>
              <h1 className="text-3xl font-bold text-white">vs {normalizedSearchName}</h1>
              <p className="text-gray-400 mt-1">
                {series.length} series • 
                <span className="text-green-400 font-semibold"> {totalWins}W</span> - 
                <span className="text-red-400 font-semibold"> {totalLosses}L</span>
                <span className="text-gray-500 ml-2">({winRate}% win rate)</span>
              </p>
            </div>
          </div>
        </header>

        {series.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg">
              No series found against {normalizedSearchName} in {activeFilterLabel}. Clear the year/stage filter to see more.
            </p>
          </div>
        ) : opponentTendencies ? (
          <OpponentDetailTabs
            opponentTeamId={opponentTeamId}
            opponentTeamName={normalizedSearchName}
            tendencies={opponentTendencies}
            pistolPercentile={leagueBenchmarks?.percentileFor(opponentTeamId, 'pistolWR') ?? null}
            antiEcoPercentile={leagueBenchmarks?.percentileFor(opponentTeamId, 'antiEcoWR') ?? null}
            series={series}
          />
        ) : null}
      </div>
    </div>
  )
}
