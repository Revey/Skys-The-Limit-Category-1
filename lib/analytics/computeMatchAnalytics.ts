export interface PlayerStats {
  name: string
  kills: number
  deaths: number
  kd: number
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
}

export function computeMatchAnalytics(match: any): MatchAnalytics {
  // teamName: use match.team?.name if exists, otherwise "Cloud9"
  const teamName =
    match.team && typeof match.team === 'object' && match.team.name
      ? match.team.name
      : 'Cloud9'

  // opponentName: use match.opponentName if present, otherwise "Unknown opponent"
  const opponentName = match.opponentName || 'Unknown opponent'

  // map: use match.map if present, otherwise "Unknown map"
  const map = match.map || 'Unknown map'

  // eventName: use match.eventName if present, otherwise undefined
  const eventName = match.eventName || undefined

  // date: prefer match.startTime, then match.date, then match.createdAt, then current date
  // Format as "YYYY-MM-DD" in UTC
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

  // teamRoundsWon and teamRoundsLost: default to 0 if missing
  const teamRoundsWon = match.teamRoundsWon ?? 0
  const teamRoundsLost = match.teamRoundsLost ?? 0

  // roundsPlayed: computed
  const roundsPlayed = teamRoundsWon + teamRoundsLost

  // players: map from match.players
  const rawPlayers = Array.isArray(match.players) ? match.players : []

  const players: PlayerStats[] = rawPlayers
    .map((player: any) => {
      // name: prefer playerName, then name
      const name = player.playerName || player.name || ''

      // Skip players with no name
      if (!name) {
        return null
      }

      const kills = player.kills ?? 0
      const deaths = player.deaths ?? 0

      // kd: if deaths > 0, use kills / deaths; otherwise use kills
      const kd = deaths > 0 ? kills / deaths : kills

      return {
        name,
        kills,
        deaths,
        kd,
      }
    })
    .filter((p: PlayerStats | null): p is PlayerStats => p !== null)
    // Sort: descending by kd, then by kills (more kills first)
    .sort((a: PlayerStats, b: PlayerStats) => {
      if (b.kd !== a.kd) {
        return b.kd - a.kd
      }
      return b.kills - a.kills
    })

  return {
    teamName,
    opponentName,
    map,
    eventName,
    date,
    roundsPlayed,
    teamRoundsWon,
    teamRoundsLost,
    players,
  }
}
