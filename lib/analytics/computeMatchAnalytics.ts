import type { MatchDocument } from '@/models/Match'

export interface PlayerStats {
  name: string
  agent?: string
  kills: number
  deaths: number
  assists: number
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

export function computeMatchAnalytics(match: MatchDocument): MatchAnalytics {
  const players: PlayerStats[] = [
    {
      name: 'Jakee',
      agent: 'Jett',
      kills: 22,
      deaths: 15,
      assists: 4,
      kd: 1.47,
    },
    {
      name: 'eeiu',
      agent: 'Omen',
      kills: 18,
      deaths: 14,
      assists: 8,
      kd: 1.29,
    },
    {
      name: 'Xeppaa',
      agent: 'Sova',
      kills: 16,
      deaths: 12,
      assists: 10,
      kd: 1.33,
    },
    {
      name: 'runi',
      agent: 'Killjoy',
      kills: 14,
      deaths: 16,
      assists: 5,
      kd: 0.88,
    },
    {
      name: 'moose',
      agent: 'Gekko',
      kills: 12,
      deaths: 13,
      assists: 7,
      kd: 0.92,
    },
  ]

  return {
    teamName: 'Cloud9 Valorant',
    opponentName: match.opponentName,
    map: match.map,
    eventName: match.eventName,
    date: new Date(match.date).toLocaleDateString(),
    roundsPlayed: 24,
    teamRoundsWon: 13,
    teamRoundsLost: 11,
    players,
  }
}
