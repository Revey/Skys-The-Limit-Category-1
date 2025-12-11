import type { MatchDocument } from '@/models/Match'

export interface PlayerStats {
  name: string
  agent?: string
  kills: number
  deaths: number
  assists: number
  kd: number
  kast?: number
  headshotPercentage?: number
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
  attackRoundsWon?: number
  defenseRoundsWon?: number
  players: PlayerStats[]
}

export function computeMatchAnalytics(match: MatchDocument): MatchAnalytics {
  const teamName = (match as { teamName?: string }).teamName ?? 'Unknown Team'
  const opponentName = match.opponentName
  const map = match.map
  const eventName = match.eventName
  const date =
    match.date instanceof Date ? match.date.toISOString() : String(match.date)

  const players: PlayerStats[] = [
    {
      name: 'Player 1',
      agent: 'Jett',
      kills: 20,
      deaths: 15,
      assists: 5,
      kd: 1.33,
      kast: 75,
      headshotPercentage: 22,
    },
    {
      name: 'Player 2',
      agent: 'Sova',
      kills: 18,
      deaths: 16,
      assists: 7,
      kd: 1.12,
      kast: 72,
      headshotPercentage: 18,
    },
    {
      name: 'Player 3',
      agent: 'Omen',
      kills: 15,
      deaths: 14,
      assists: 8,
      kd: 1.07,
      kast: 78,
      headshotPercentage: 16,
    },
    {
      name: 'Player 4',
      agent: 'Killjoy',
      kills: 17,
      deaths: 17,
      assists: 6,
      kd: 1,
      kast: 70,
      headshotPercentage: 20,
    },
    {
      name: 'Player 5',
      agent: 'Astra',
      kills: 12,
      deaths: 13,
      assists: 10,
      kd: 0.92,
      kast: 74,
      headshotPercentage: 14,
    },
  ]

  return {
    teamName,
    opponentName,
    map,
    eventName,
    date,
    roundsPlayed: 24,
    teamRoundsWon: 13,
    teamRoundsLost: 11,
    attackRoundsWon: 6,
    defenseRoundsWon: 7,
    players,
  }
}
