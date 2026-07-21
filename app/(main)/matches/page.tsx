import { cookies } from 'next/headers'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { OpponentList, type OpponentRow } from '@/components/matches/OpponentList'
import { normalizeTeamName, getTeamKey } from '@/lib/teamUtils'
import { getMapsStats } from '@/lib/types/evidence'
import { getFocusTeam } from '@/lib/focusTeam'
import { getVctFilter, tournamentIdsFor } from '@/lib/vctFilter'
import { stageLabel, tournamentLabel } from '@/lib/tournaments'

export const dynamic = 'force-dynamic'

function getOpponentStats(matches: MatchDocument[], focusTeamId: string): OpponentRow[] {
  const focusTeamMatches = matches.filter(match => {
    const mapsStats = getMapsStats(match.analytics?.evidence_v1)
    if (mapsStats.length === 0) return false
    return mapsStats.some(stat => stat.teamId === focusTeamId)
  })

  // Use normalized team key for grouping
  const opponentMap = new Map<string, {
    displayName: string  // Use the first encountered name (without suffix)
    seriesIds: Set<string>
    seriesWins: number
    seriesLosses: number
    mapsWon: number
    mapsLost: number
    latestGridSeriesId: string
    latestTournamentId: string
    latestResult: 'W' | 'L'
  }>()

  for (const match of focusTeamMatches) {
    const evidence = match.analytics?.evidence_v1
    if (!evidence) continue

    const mapsStats = getMapsStats(evidence)
    const seriesId = match.gridSeriesId

    let rawOpponentName = 'Unknown'
    for (const stat of mapsStats) {
      if (stat.teamId !== focusTeamId && stat.teamName) {
        rawOpponentName = stat.teamName
        break
      }
    }

    // Normalize the team name (removes "(1)" suffix)
    const normalizedName = normalizeTeamName(rawOpponentName)
    const teamKey = getTeamKey(rawOpponentName)

    if (!opponentMap.has(teamKey)) {
      opponentMap.set(teamKey, {
        displayName: normalizedName,
        seriesIds: new Set(),
        seriesWins: 0,
        seriesLosses: 0,
        mapsWon: 0,
        mapsLost: 0,
        latestGridSeriesId: '',
        latestTournamentId: '',
        latestResult: 'L',
      })
    }

    const opponent = opponentMap.get(teamKey)!
    
    if (seriesId && !opponent.seriesIds.has(seriesId)) {
      opponent.seriesIds.add(seriesId)

      const gameStats = new Map<string, { c9: number; opp: number }>()
      for (const stat of mapsStats) {
        const gameId = stat.gameId
        if (!gameStats.has(gameId)) {
          gameStats.set(gameId, { c9: 0, opp: 0 })
        }
        if (stat.teamId === focusTeamId) {
          gameStats.get(gameId)!.c9 = stat.roundsWon
        } else {
          gameStats.get(gameId)!.opp = stat.roundsWon
        }
      }

      let c9MapsWon = 0
      let oppMapsWon = 0
      for (const [, stats] of gameStats) {
        if (stats.c9 > stats.opp) {
          c9MapsWon++
          opponent.mapsWon++
        } else if (stats.opp > stats.c9) {
          oppMapsWon++
          opponent.mapsLost++
        }
      }

      if (c9MapsWon > oppMapsWon) {
        opponent.seriesWins++
      } else if (oppMapsWon > c9MapsWon) {
        opponent.seriesLosses++
      }

      const isLatestSeries = !opponent.latestGridSeriesId
        || Number.parseInt(seriesId, 10) > Number.parseInt(opponent.latestGridSeriesId, 10)

      if (isLatestSeries) {
        opponent.latestGridSeriesId = seriesId
        opponent.latestTournamentId = match.tournamentId ?? ''
        opponent.latestResult = c9MapsWon > oppMapsWon ? 'W' : 'L'
      }
    }
  }

  return Array.from(opponentMap.entries())
    .map(([, stats]) => ({
      name: stats.displayName,  // Use normalized display name
      seriesCount: stats.seriesIds.size,
      seriesWins: stats.seriesWins,
      seriesLosses: stats.seriesLosses,
      mapsWon: stats.mapsWon,
      mapsLost: stats.mapsLost,
      latestTournamentId: stats.latestTournamentId,
      latestResult: stats.latestResult,
    }))
    .sort((a, b) => (
      Number.parseInt(b.latestTournamentId, 10) - Number.parseInt(a.latestTournamentId, 10)
    ))
}

export default async function MatchesPage() {
  // await requireAuth()
  const focusTeam = getFocusTeam(await cookies())
  const vct = getVctFilter(await cookies())
  const vctIds = tournamentIdsFor(vct)
  await connectToDB()

  const matches = (await Match.aggregate([
    {
      $match: {
        'analytics.evidence_v1': { $exists: true },
        ...(vctIds ? { tournamentId: { $in: vctIds } } : {}),
      },
    },
    {
      $project: {
        gridSeriesId: 1,
        tournamentId: 1,
        'analytics.evidence_v1.derived.mapsStats': 1
      }
    },
    { $sort: { _id: -1 } }
  ])) as unknown as MatchDocument[]

  const opponents = getOpponentStats(matches, focusTeam.teamId)
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">Opponents</h1>
          <p className="text-gray-400">
            {focusTeam.teamName} match history by opponent • {opponents.length} teams faced
          </p>
        </div>

        {opponents.length > 0 && <OpponentList rows={opponents} />}

        {opponents.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No matches found for {focusTeam.teamName} in {activeFilterLabel}. Clear the year/stage filter to see more.
          </div>
        )}
      </div>
    </div>
  )
}
