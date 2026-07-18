import type { EconomyRound, GameInfo } from '@/lib/types/evidence'

export interface EconomyTimelinePoint {
  gameId: string
  mapName: string
  roundNumber: number
  continuousRound: number
  roundLabel: string
  teamEconomy?: number
  opponentEconomy?: number
  teamTier?: string
  opponentTier?: string
  teamWon?: boolean
}

export interface EconomyGameSeparator {
  roundLabel: string
  mapName: string
}

export interface EconomyTimelineData {
  points: EconomyTimelinePoint[]
  separators: EconomyGameSeparator[]
}

interface PrepareEconomyTimelineOptions {
  teamId: string
  opponentTeamId?: string
  selectedGameId?: string
}

function economyKey(gameId: string, roundNumber: number): string {
  return `${gameId}:${roundNumber}`
}

export function prepareEconomyTimeline(
  economyRounds: EconomyRound[],
  games: GameInfo[],
  options: PrepareEconomyTimelineOptions
): EconomyTimelineData {
  const { teamId, opponentTeamId, selectedGameId } = options
  const filteredRounds = selectedGameId
    ? economyRounds.filter(round => round.gameId === selectedGameId)
    : economyRounds

  if (filteredRounds.length === 0) return { points: [], separators: [] }

  const gameById = new Map(games.map(game => [game.gameId, game]))
  const configuredGameIds = [...games]
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map(game => game.gameId)
  const observedGameIds = filteredRounds.map(round => round.gameId)
  const orderedGameIds = Array.from(new Set([...configuredGameIds, ...observedGameIds]))
    .filter(gameId => !selectedGameId || gameId === selectedGameId)

  const entriesByKey = new Map<string, EconomyRound[]>()
  for (const economyRound of filteredRounds) {
    const key = economyKey(economyRound.gameId, economyRound.roundNumber)
    const entries = entriesByKey.get(key) || []
    entries.push(economyRound)
    entriesByKey.set(key, entries)
  }

  const points: EconomyTimelinePoint[] = []
  const separators: EconomyGameSeparator[] = []
  let continuousRound = 0

  orderedGameIds.forEach((gameId, gameIndex) => {
    const roundNumbers = Array.from(new Set(
      filteredRounds
        .filter(round => round.gameId === gameId)
        .map(round => round.roundNumber)
    )).sort((a, b) => a - b)

    roundNumbers.forEach((roundNumber, roundIndex) => {
      const entries = entriesByKey.get(economyKey(gameId, roundNumber)) || []
      const teamRound = entries.find(entry => entry.teamId === teamId)
      const opponentRound = entries.find(entry =>
        opponentTeamId
          ? entry.teamId === opponentTeamId
          : entry.teamId !== teamId
      )
      const chartRound = selectedGameId ? roundNumber : ++continuousRound
      if (selectedGameId) continuousRound = chartRound

      const point: EconomyTimelinePoint = {
        gameId,
        mapName: gameById.get(gameId)?.mapName || 'Unknown',
        roundNumber,
        continuousRound: chartRound,
        roundLabel: `R${chartRound}`,
      }

      if (teamRound && Number.isFinite(teamRound.avgLoadoutValue)) {
        point.teamEconomy = teamRound.avgLoadoutValue
        point.teamTier = teamRound.economyTier
        point.teamWon = teamRound.roundWon
      }
      if (opponentRound && Number.isFinite(opponentRound.avgLoadoutValue)) {
        point.opponentEconomy = opponentRound.avgLoadoutValue
        point.opponentTier = opponentRound.economyTier
      }

      points.push(point)

      if (!selectedGameId && gameIndex > 0 && roundIndex === 0) {
        separators.push({
          roundLabel: point.roundLabel,
          mapName: point.mapName,
        })
      }
    })
  })

  return { points, separators }
}
