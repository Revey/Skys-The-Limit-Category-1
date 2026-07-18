import type {
  ClutchSituation,
  KillEvent,
  MultiKillRound,
  MultiKillStat,
  PlayerInfo,
} from '@/lib/types/evidence'

export interface PlayerCardStat {
  playerId: string
  playerName: string
  teamId: string
  kills?: number
  deaths?: number
  kd?: number
  firstBloods?: number
  firstDeaths?: number
  isolatedDeathsCount?: number
  clutchWins?: number
  clutchAttempts?: number
  multiKillCount?: number
}

export interface PlayerCardEvidence {
  players?: PlayerInfo[]
  kills?: KillEvent[]
  clutchSituations?: ClutchSituation[]
  derived?: {
    multiKillRounds?: MultiKillRound[]
    multiKillStats?: MultiKillStat[]
  }
}

interface ComputePlayerCardsOptions {
  focusTeamId: string
  selectedGameId?: string
}

function numeric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function computePlayerCards(
  evidence: PlayerCardEvidence,
  options: ComputePlayerCardsOptions
): PlayerCardStat[] {
  const players = evidence.players || []
  const selectedGameId = options.selectedGameId
  const selectedKills = selectedGameId
    ? (evidence.kills || []).filter(kill => kill.gameId === selectedGameId)
    : []
  const selectedClutches = selectedGameId
    ? (evidence.clutchSituations || []).filter(clutch => clutch.gameId === selectedGameId)
    : evidence.clutchSituations || []
  const selectedMultiKillRounds = selectedGameId
    ? (evidence.derived?.multiKillRounds || []).filter(round => round.gameId === selectedGameId)
    : []

  const activePlayerIds = new Set<string>()
  if (selectedGameId) {
    selectedKills.forEach(kill => {
      if (kill.killerId) activePlayerIds.add(kill.killerId)
      if (kill.victimId) activePlayerIds.add(kill.victimId)
    })
    selectedClutches.forEach(clutch => activePlayerIds.add(clutch.playerId))
    selectedMultiKillRounds.forEach(round => activePlayerIds.add(round.playerId))
  }

  const cards = players
    .filter(player => !selectedGameId || activePlayerIds.has(player.playerId))
    .map<PlayerCardStat>(player => {
      const card: PlayerCardStat = {
        playerId: player.playerId,
        playerName: player.playerName || `Player ${player.playerId}`,
        teamId: player.teamId,
      }

      if (selectedGameId) {
        const kills = selectedKills.filter(kill => kill.killerId === player.playerId).length
        const deaths = selectedKills.filter(kill => kill.victimId === player.playerId).length
        card.kills = kills
        card.deaths = deaths
        card.kd = deaths > 0 ? kills / deaths : kills
        card.firstBloods = selectedKills.filter(
          kill => kill.killerId === player.playerId && kill.isFirstBlood === true
        ).length
        card.firstDeaths = selectedKills.filter(
          kill => kill.victimId === player.playerId && kill.isFirstBlood === true
        ).length
        card.isolatedDeathsCount = selectedKills.filter(
          kill => kill.victimId === player.playerId && kill.isIsolated === true
        ).length
      } else {
        if (numeric(player.kills)) card.kills = player.kills
        if (numeric(player.deaths)) card.deaths = player.deaths
        if (numeric(player.kd)) {
          card.kd = player.kd
        } else if (card.kills !== undefined && card.deaths !== undefined) {
          card.kd = card.deaths > 0 ? card.kills / card.deaths : card.kills
        }
        if (numeric(player.firstBloods)) card.firstBloods = player.firstBloods
        if (numeric(player.firstDeaths)) card.firstDeaths = player.firstDeaths
        if (numeric(player.isolatedDeathsCount)) {
          card.isolatedDeathsCount = player.isolatedDeathsCount
        }
      }

      if (Array.isArray(evidence.clutchSituations)) {
        const playerClutches = selectedClutches.filter(
          clutch => clutch.playerId === player.playerId
        )
        card.clutchAttempts = playerClutches.length
        card.clutchWins = playerClutches.filter(clutch => clutch.won === true).length
      }

      if (selectedGameId && Array.isArray(evidence.derived?.multiKillRounds)) {
        card.multiKillCount = selectedMultiKillRounds.filter(
          round => round.playerId === player.playerId
        ).length
      } else if (!selectedGameId && Array.isArray(evidence.derived?.multiKillStats)) {
        const multiKillStat = evidence.derived.multiKillStats.find(
          stat => stat.playerId === player.playerId
        )
        card.multiKillCount = multiKillStat?.totalMultiKills || 0
      }

      return card
    })

  return cards.sort((a, b) => {
    const focusDelta = Number(b.teamId === options.focusTeamId) - Number(a.teamId === options.focusTeamId)
    return focusDelta || (b.kills ?? 0) - (a.kills ?? 0) || a.playerName.localeCompare(b.playerName)
  })
}
