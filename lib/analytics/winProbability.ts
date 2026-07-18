export interface WinProbabilityClutch {
  playerName: string
  situation: string
  isFocusTeam: boolean
}

export interface WinProbabilityRound {
  roundNumber: number
  gameId: string
  winnerTeamId: string
  momentumShift?: boolean
  isCritical?: boolean
  clutch?: WinProbabilityClutch
}

export interface WinProbabilityGame {
  gameId: string
  mapName: string
  sequenceNumber?: number
}

export interface WinProbabilityPoint {
  round: number
  roundLabel: string
  winProb: number
  teamScore: number
  opponentScore: number
  score: string
  isTeamWin: boolean | null
  mapName: string
  gameId: string
  clutch?: WinProbabilityClutch
  isCritical?: boolean
  momentumShift?: boolean
}

function combination(n: number, k: number): number {
  const smallerK = Math.min(k, n - k)
  let result = 1

  for (let i = 1; i <= smallerK; i++) {
    result = (result * (n - smallerK + i)) / i
  }

  return result
}

/**
 * Probability that the focus team wins the race to 13 rounds, assuming each
 * future round is an independent 50/50 outcome.
 *
 * Unit-style assertions (within floating-point tolerance):
 * mapWinProbability(12, 0) ~= 0.99988
 * mapWinProbability(0, 12) ~= 0.00012
 * mapWinProbability(0, 0) === 0.5
 */
export function mapWinProbability(teamScore: number, oppScore: number): number {
  const normalizedTeamScore = Number.isFinite(teamScore)
    ? Math.max(0, Math.floor(teamScore))
    : 0
  const normalizedOppScore = Number.isFinite(oppScore)
    ? Math.max(0, Math.floor(oppScore))
    : 0
  const needTeam = Math.max(13 - normalizedTeamScore, 1)
  const needOpponent = Math.max(13 - normalizedOppScore, 1)

  let probability = 0
  for (let opponentWins = 0; opponentWins < needOpponent; opponentWins++) {
    probability +=
      combination(needTeam - 1 + opponentWins, opponentWins) *
      Math.pow(0.5, needTeam + opponentWins)
  }

  return Math.min(1, Math.max(0, probability))
}

export function displayWinProbability(teamScore: number, oppScore: number): number {
  const percent = Math.round(mapWinProbability(teamScore, oppScore) * 100)
  return Math.min(98, Math.max(2, percent))
}

export function buildWinProbabilityTimeline(
  rounds: WinProbabilityRound[],
  games: WinProbabilityGame[],
  teamId: string
): WinProbabilityPoint[] {
  if (rounds.length === 0) return []

  const gameOrder = new Map(
    [...games]
      .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))
      .map((game, index) => [game.gameId, index])
  )
  const gameById = new Map(games.map(game => [game.gameId, game]))
  const orderedRounds = [...rounds].sort((a, b) => {
    const gameDelta =
      (gameOrder.get(a.gameId) ?? Number.MAX_SAFE_INTEGER) -
      (gameOrder.get(b.gameId) ?? Number.MAX_SAFE_INTEGER)
    return gameDelta || a.roundNumber - b.roundNumber
  })

  const firstRound = orderedRounds[0]
  const firstMapName = gameById.get(firstRound.gameId)?.mapName || 'Unknown'
  const points: WinProbabilityPoint[] = [{
    round: 0,
    roundLabel: 'Start',
    winProb: 50,
    teamScore: 0,
    opponentScore: 0,
    score: '0-0',
    isTeamWin: null,
    mapName: firstMapName,
    gameId: firstRound.gameId,
  }]

  let currentGameId = ''
  let teamScore = 0
  let opponentScore = 0

  orderedRounds.forEach((round, index) => {
    if (round.gameId !== currentGameId) {
      currentGameId = round.gameId
      teamScore = 0
      opponentScore = 0
    }

    const isTeamWin = round.winnerTeamId === teamId
    if (isTeamWin) teamScore++
    else opponentScore++

    points.push({
      round: round.roundNumber,
      roundLabel: `R${index + 1}`,
      winProb: displayWinProbability(teamScore, opponentScore),
      teamScore,
      opponentScore,
      score: `${teamScore}-${opponentScore}`,
      isTeamWin,
      mapName: gameById.get(round.gameId)?.mapName || 'Unknown',
      gameId: round.gameId,
      clutch: round.clutch,
      isCritical: round.isCritical,
      momentumShift: round.momentumShift,
    })
  })

  return points
}
