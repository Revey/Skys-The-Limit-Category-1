import type { MatchDocument } from '@/models/Match'
import type { DashboardStatsDocument } from '@/models/DashboardStats'
import { getMapsStats } from '@/lib/types/evidence'
import { DEFAULT_TEAM } from '@/lib/focusTeam'
import { normalizeTeamName } from '@/lib/teamUtils'

interface OpponentRecordInternal {
  displayName: string
  seriesIds: Set<string>
  seriesWins: number
  seriesLosses: number
  mapsWon: number
  mapsLost: number
}

function getEvidenceSeriesTimestamp(match: MatchDocument): number {
  let earliestTimestamp = Number.POSITIVE_INFINITY

  for (const round of match.analytics?.evidence_v1?.rounds || []) {
    const timestamp = round.firstBlood?.timestamp
    if (!timestamp) continue

    const value = Date.parse(timestamp)
    if (!Number.isNaN(value) && value < earliestTimestamp) {
      earliestTimestamp = value
    }
  }

  return Number.isFinite(earliestTimestamp) ? earliestTimestamp : 0
}

/**
 * Compute dashboard statistics from match data for storage in DashboardStats collection
 * This is the same logic as the original computeDashboardStats but returns data in storage format
 */
export function computeDashboardStatsForStorage(
  matches: MatchDocument[],
  teamId: string = DEFAULT_TEAM.teamId
): Omit<DashboardStatsDocument, '_id' | 'createdAt' | 'updatedAt'> {
  // Filter matches with focus-team participation
  const focusTeamMatches = matches.filter((match) => {
    const mapsStats = getMapsStats(match.analytics?.evidence_v1)
    if (mapsStats.length === 0) return false
    return mapsStats.some((stat) => stat.teamId === teamId)
  })

  // Build series map for deduplication
  const seriesMap = new Map<string, MatchDocument>()
  for (const match of focusTeamMatches) {
    const seriesId = match.gridSeriesId
    if (seriesId && !seriesMap.has(seriesId)) {
      seriesMap.set(seriesId, match)
    }
  }

  const seriesResults: Array<{
    evidenceTimestamp: number
    data: {
      seriesId: string
      opponent: string
      c9MapsWon: number
      opponentMapsWon: number
      isWin: boolean
      matchDate?: string
      games: Array<{
        mapName: string
        c9Rounds: number
        opponentRounds: number
      }>
    }
  }> = []

  const mapsPlayed: Record<string, number> = {}
  const opponentRecords = new Map<string, OpponentRecordInternal>()
  let totalAttackWins = 0
  let totalAttackRounds = 0
  let totalDefenseWins = 0
  let totalDefenseRounds = 0

  // Process each series
  for (const [seriesId, match] of seriesMap) {
    const evidence = match.analytics?.evidence_v1
    if (!evidence) continue

    const mapsStats = getMapsStats(evidence)
    const games = evidence.games || []

    // Build game stats map
    const gameStats = new Map<
      string,
      { c9: { teamId: string; roundsWon: number }; opponent: { teamId: string; teamName: string; roundsWon: number } | null }
    >()

    for (const stat of mapsStats) {
      const gameId = stat.gameId
      if (!gameStats.has(gameId)) {
        gameStats.set(gameId, { c9: { teamId: '', roundsWon: 0 }, opponent: null })
      }
      if (stat.teamId === teamId) {
        gameStats.get(gameId)!.c9 = { teamId: stat.teamId, roundsWon: stat.roundsWon }
      } else {
        gameStats.get(gameId)!.opponent = {
          teamId: stat.teamId,
          teamName: stat.teamName,
          roundsWon: stat.roundsWon,
        }
      }
    }

    let c9MapsWon = 0
    let opponentMapsWon = 0
    let opponentName = match.opponentName || 'Unknown'
    const gameResults: Array<{ mapName: string; c9Rounds: number; opponentRounds: number }> = []

    for (const game of games) {
      const stats = gameStats.get(game.gameId)
      if (!stats?.c9 || !stats?.opponent) continue

      const mapName = game.mapName
      mapsPlayed[mapName] = (mapsPlayed[mapName] || 0) + 1

      const c9Rounds = stats.c9.roundsWon
      const oppRounds = stats.opponent.roundsWon
      opponentName = normalizeTeamName(stats.opponent.teamName)

      gameResults.push({ mapName, c9Rounds, opponentRounds: oppRounds })

      if (c9Rounds > oppRounds) c9MapsWon++
      else if (oppRounds > c9Rounds) opponentMapsWon++
    }

    const isWin = c9MapsWon > opponentMapsWon

    // Only count series with a definitive winner
    if (c9MapsWon !== opponentMapsWon) {
      // Track opponent records
      if (!opponentRecords.has(opponentName)) {
        opponentRecords.set(opponentName, {
          displayName: opponentName,
          seriesIds: new Set([seriesId]),
          seriesWins: isWin ? 1 : 0,
          seriesLosses: isWin ? 0 : 1,
          mapsWon: c9MapsWon,
          mapsLost: opponentMapsWon,
        })
      } else {
        const record = opponentRecords.get(opponentName)!
        record.seriesIds.add(seriesId)
        if (isWin) record.seriesWins++
        else record.seriesLosses++
        record.mapsWon += c9MapsWon
        record.mapsLost += opponentMapsWon
      }
    }

    const evidenceTimestamp = getEvidenceSeriesTimestamp(match)
    seriesResults.push({
      evidenceTimestamp,
      data: {
        seriesId,
        opponent: opponentName,
        c9MapsWon,
        opponentMapsWon,
        isWin,
        matchDate: evidenceTimestamp
          ? new Date(evidenceTimestamp).toISOString().slice(0, 10)
          : undefined,
        games: gameResults,
      },
    })

    // Calculate attack/defense win rates
    const rounds = evidence.rounds || []
    for (const round of rounds) {
      const winnerSide = round.winnerSide
      const winnerTeamId = round.winnerTeamId
      if (winnerSide === 'attack') {
        totalAttackRounds++
        if (winnerTeamId === teamId) totalAttackWins++
      } else if (winnerSide === 'defense') {
        totalDefenseRounds++
        if (winnerTeamId === teamId) totalDefenseWins++
      }
    }
  }

  // Calculate struggling opponents the focus team has lost more against
  const strugglingAgainst = Array.from(opponentRecords.values())
    .filter((record) => record.seriesLosses > record.seriesWins)
    .sort((a, b) => b.seriesLosses - a.seriesLosses)
    .slice(0, 5)
    .map((record) => ({
      name: record.displayName,
      seriesWins: record.seriesWins,
      seriesLosses: record.seriesLosses,
      mapsWon: record.mapsWon,
      mapsLost: record.mapsLost,
    }))

  // Calculate totals
  const totalSeries = seriesMap.size
  const seriesWins = seriesResults.filter((series) => series.data.isWin).length
  const seriesLosses = seriesResults.filter((series) => !series.data.isWin).length
  const recentSeries = seriesResults
    .sort((a, b) =>
      b.evidenceTimestamp - a.evidenceTimestamp ||
      Number.parseInt(b.data.seriesId, 10) - Number.parseInt(a.data.seriesId, 10)
    )
    .slice(0, 10)
    .map((series) => series.data)

  return {
    teamId,
    totalSeries,
    seriesWins,
    seriesLosses,
    mapsPlayed: new Map(Object.entries(mapsPlayed)),
    attackWinRate: totalAttackRounds > 0 ? totalAttackWins / totalAttackRounds : 0,
    defenseWinRate: totalDefenseRounds > 0 ? totalDefenseWins / totalDefenseRounds : 0,
    recentSeries,
    strugglingAgainst,
    lastUpdated: new Date(),
    matchesProcessed: focusTeamMatches.length,
  }
}
