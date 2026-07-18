import { DEFAULT_TEAM } from '@/lib/focusTeam'
import { normalizeTeamName } from '@/lib/teamUtils'

export interface PlayerStats {
  name: string
  kills: number
  deaths: number
  kd: number
  firstBloods?: number
  firstDeaths?: number
  isolatedDeaths?: number
}

export interface RoundStats {
  attackWins: number
  attackTotal: number
  defenseWins: number
  defenseTotal: number
  attackWinRate: number
  defenseWinRate: number
}

export interface MatchAnalytics {
  teamName: string
  opponentName: string
  map: string
  eventName?: string
  date: string
  roundsPlayed: number
  teamRoundsWon: number
  teamRoundsLost: number
  players: PlayerStats[]
  // Evidence-based stats
  roundStats?: RoundStats
  firstBloodConversion?: number
  postPlantWinRate?: number
  hasEvidence: boolean
}

export function computeMatchAnalytics(
  match: any,
  focusTeamId: string = DEFAULT_TEAM.teamId,
  focusTeamName: string = DEFAULT_TEAM.teamName
): MatchAnalytics {
  const evidence = match.analytics?.evidence_v1
  const mapsStats = evidence?.derived?.mapsStats || []
  const focusTeamStat = mapsStats.find((stat: any) => stat.teamId === focusTeamId)
  const opponentStat = mapsStats.find((stat: any) => stat.teamId !== focusTeamId)

  const teamName = focusTeamStat?.teamName
    ? normalizeTeamName(focusTeamStat.teamName)
    : focusTeamName
  const opponentName = opponentStat?.teamName
    ? normalizeTeamName(opponentStat.teamName)
    : match.opponentName || 'Unknown opponent'
  const map = match.map || 'Unknown map'
  const eventName = match.eventName || undefined

  // Date handling
  let dateValue: Date
  if (match.startTime) {
    dateValue = new Date(match.startTime)
  } else if (match.date) {
    dateValue = new Date(match.date)
  } else if (match.createdAt) {
    dateValue = new Date(match.createdAt)
  } else {
    dateValue = new Date()
  }
  const date = dateValue.toISOString().slice(0, 10)

  const hasEvidence = !!evidence

  // Compute from evidence if available
  if (hasEvidence) {
    return computeFromEvidence(
      match,
      evidence,
      {
        teamName,
        opponentName,
        map,
        eventName,
        date,
      },
      focusTeamId
    )
  }

  // Fallback to legacy computation
  return computeLegacy(match, { teamName, opponentName, map, eventName, date })
}

function computeFromEvidence(
  match: any,
  evidence: any,
  base: {
    teamName: string
    opponentName: string
    map: string
    eventName?: string
    date: string
  },
  focusTeamId: string
): MatchAnalytics {
  const rounds = evidence.rounds || []
  const players = evidence.players || []
  const derived = evidence.derived || {}

  // Compute round stats
  let attackWins = 0,
    attackTotal = 0,
    defenseWins = 0,
    defenseTotal = 0
  let teamRoundsWon = 0,
    teamRoundsLost = 0

  for (const round of rounds) {
    const isFocusTeamWinner = round.winnerTeamId === focusTeamId
    const winnerSide = round.winnerSide

    if (isFocusTeamWinner) {
      teamRoundsWon++
      if (winnerSide === 'attack') attackWins++
      else if (winnerSide === 'defense') defenseWins++
    } else {
      teamRoundsLost++
    }

    // Track totals based on the focus team's side this round
    // winnerSide tells us what side the WINNER was on
    if (winnerSide === 'attack') {
      if (isFocusTeamWinner) attackTotal++
      else defenseTotal++
    } else if (winnerSide === 'defense') {
      if (isFocusTeamWinner) defenseTotal++
      else attackTotal++
    }
  }

  // Fallback: if no side data, estimate from round numbers (first 12 = one side)
  if (attackTotal === 0 && defenseTotal === 0 && rounds.length > 0) {
    // Group by game
    const gameRounds = groupBy(rounds, 'gameId')
    for (const gameRoundList of Object.values(gameRounds)) {
      for (const round of gameRoundList as any[]) {
        const roundNum = round.roundNumber || 0
        const isFocusTeamWinner = round.winnerTeamId === focusTeamId
        const isFirstHalf = roundNum <= 12

        // Assume the focus team attacks first half when side data is unavailable.
        if (isFirstHalf) {
          attackTotal++
          if (isFocusTeamWinner) attackWins++
        } else if (roundNum <= 24) {
          defenseTotal++
          if (isFocusTeamWinner) defenseWins++
        }
        // OT rounds: harder to track without side data
      }
    }
  }

  const roundStats: RoundStats = {
    attackWins,
    attackTotal,
    defenseWins,
    defenseTotal,
    attackWinRate: attackTotal > 0 ? attackWins / attackTotal : 0,
    defenseWinRate: defenseTotal > 0 ? defenseWins / defenseTotal : 0,
  }

  // First blood conversion from derived stats
  const fbStats = derived.firstBloodStats || []
  const focusTeamFbStat = fbStats.find((s: any) => s.teamId === focusTeamId)
  const firstBloodConversion = focusTeamFbStat?.conversionRate ?? undefined

  // Post-plant win rate
  const plantStats = derived.plantStats || []
  const focusTeamPlantStat = plantStats.find((s: any) => s.teamId === focusTeamId)
  const postPlantWinRate = focusTeamPlantStat?.postPlantWinRate ?? undefined

  // Map evidence players to PlayerStats
  const playerStats: PlayerStats[] = players
    .filter((p: any) => p.teamId === focusTeamId)
    .map((p: any) => {
      // Try to find player name from match.players
      const matchPlayer = Array.isArray(match.players)
        ? match.players.find((mp: any) => mp.playerId === p.playerId)
        : null
      const name =
        matchPlayer?.playerName ||
        matchPlayer?.name ||
        `Player ${p.playerId}`

      return {
        name,
        kills: p.kills,
        deaths: p.deaths,
        kd: p.kd,
        firstBloods: p.firstBloods,
        firstDeaths: p.firstDeaths,
        isolatedDeaths: p.isolatedDeathsCount,
      }
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.kd - a.kd)

  return {
    ...base,
    roundsPlayed: teamRoundsWon + teamRoundsLost,
    teamRoundsWon,
    teamRoundsLost,
    players: playerStats,
    roundStats,
    firstBloodConversion,
    postPlantWinRate,
    hasEvidence: true,
  }
}

function computeLegacy(
  match: any,
  base: {
    teamName: string
    opponentName: string
    map: string
    eventName?: string
    date: string
  }
): MatchAnalytics {
  const teamRoundsWon = match.teamRoundsWon ?? 0
  const teamRoundsLost = match.teamRoundsLost ?? 0

  const rawPlayers = Array.isArray(match.players) ? match.players : []
  const players: PlayerStats[] = rawPlayers
    .map((p: any) => {
      const name = p.playerName || p.name || ''
      if (!name) {
        return null
      }

      const kills = p.kills ?? 0
      const deaths = p.deaths ?? 0
      const kd = deaths > 0 ? kills / deaths : kills

      return {
        name,
        kills,
        deaths,
        kd,
      }
    })
    .filter((p: PlayerStats | null): p is PlayerStats => p !== null)
    .sort((a: PlayerStats, b: PlayerStats) => {
      if (b.kd !== a.kd) {
        return b.kd - a.kd
      }
      return b.kills - a.kills
    })

  return {
    ...base,
    roundsPlayed: teamRoundsWon + teamRoundsLost,
    teamRoundsWon,
    teamRoundsLost,
    players,
    hasEvidence: false,
  }
}
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key])
      acc[k] = acc[k] || []
      acc[k].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}
