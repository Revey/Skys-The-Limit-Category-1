import type {
  ClutchSituation,
  EconomyRound,
  GameInfo,
  MultiKillRound,
} from '@/lib/types/evidence'

export interface Highlight {
  gameId: string
  roundNumber: number
  type: 'clutch' | 'multikill' | 'eco_upset'
  teamId: string
  playerId?: string
  playerName?: string
  label: string
  teamName?: string
  mapName?: string
  isFocusTeam: boolean
}

export interface EvidenceV1Like {
  games?: GameInfo[]
  clutchSituations?: ClutchSituation[]
  economyRounds?: EconomyRound[]
  derived?: {
    multiKillRounds?: MultiKillRound[]
  }
}

const TYPE_ORDER: Record<Highlight['type'], number> = {
  clutch: 0,
  multikill: 1,
  eco_upset: 2,
}

function roundKey(gameId: string, roundNumber: number): string {
  return `${gameId}:${roundNumber}`
}

function multiKillLabel(kills: number): string {
  return kills >= 5 ? 'ACE' : `${kills}K`
}

export function computeHighlights(
  evidence: EvidenceV1Like,
  focusTeamId = ''
): Highlight[] {
  const games = evidence.games || []
  const gameById = new Map(games.map(game => [game.gameId, game]))
  const gameOrder = new Map(
    [...games]
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map((game, index) => [game.gameId, index])
  )
  const highlights: Highlight[] = []

  for (const clutch of evidence.clutchSituations || []) {
    if (clutch.won !== true) continue

    const playerName = clutch.playerName || `Player ${clutch.playerId}`
    highlights.push({
      gameId: clutch.gameId,
      roundNumber: clutch.roundNumber,
      type: 'clutch',
      teamId: clutch.teamId,
      playerId: clutch.playerId,
      playerName,
      label: `${playerName} won ${clutch.situation}`,
      mapName: gameById.get(clutch.gameId)?.mapName,
      isFocusTeam: clutch.teamId === focusTeamId,
    })
  }

  for (const multiKill of evidence.derived?.multiKillRounds || []) {
    if (multiKill.kills < 3) continue

    const playerName = multiKill.playerName || `Player ${multiKill.playerId}`
    highlights.push({
      gameId: multiKill.gameId,
      roundNumber: multiKill.roundNumber,
      type: 'multikill',
      teamId: multiKill.teamId,
      playerId: multiKill.playerId,
      playerName,
      label: `${playerName} ${multiKillLabel(multiKill.kills)}`,
      teamName: multiKill.teamName,
      mapName: gameById.get(multiKill.gameId)?.mapName,
      isFocusTeam: multiKill.teamId === focusTeamId,
    })
  }

  const economyByRound = new Map<string, EconomyRound[]>()
  for (const economyRound of evidence.economyRounds || []) {
    const key = roundKey(economyRound.gameId, economyRound.roundNumber)
    const entries = economyByRound.get(key) || []
    entries.push(economyRound)
    economyByRound.set(key, entries)
  }

  for (const entries of economyByRound.values()) {
    for (const economyRound of entries) {
      const isLowEconomy =
        economyRound.economyTier === 'eco' || economyRound.economyTier === 'save'
      const facedFullBuy = entries.some(
        opponent =>
          opponent.teamId !== economyRound.teamId &&
          opponent.economyTier === 'full_buy'
      )

      if (!isLowEconomy || economyRound.roundWon !== true || !facedFullBuy) continue

      highlights.push({
        gameId: economyRound.gameId,
        roundNumber: economyRound.roundNumber,
        type: 'eco_upset',
        teamId: economyRound.teamId,
        teamName: economyRound.teamName,
        label: `${economyRound.teamName} won eco vs full buy`,
        mapName: gameById.get(economyRound.gameId)?.mapName,
        isFocusTeam: economyRound.teamId === focusTeamId,
      })
    }
  }

  return highlights.sort((a, b) => {
    const gameDelta =
      (gameOrder.get(a.gameId) ?? Number.MAX_SAFE_INTEGER) -
      (gameOrder.get(b.gameId) ?? Number.MAX_SAFE_INTEGER)
    return gameDelta || a.roundNumber - b.roundNumber || TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
  })
}
