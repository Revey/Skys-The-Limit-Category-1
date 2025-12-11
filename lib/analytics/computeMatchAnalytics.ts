import type { MatchDocument } from '@/models/Match'

export type PlayerStat = {
  name: string
  rating: number
  kills: number
  deaths: number
}

export type MatchAnalytics = {
  win: boolean
  rounds: number
  attackWinRate: number
  defenseWinRate: number
  topPlayers: PlayerStat[]
  notes: string
}

export function computeMatchAnalytics(match: MatchDocument): MatchAnalytics {
  // Placeholder values derived from map name hash for determinism
  const hash = Array.from(match.map).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const win = hash % 2 === 0
  const rounds = 13 + (hash % 11) // 13 to 23
  const attackWinRate = (hash % 51) + 25 // 25-75
  const defenseWinRate = 100 - attackWinRate
  const topPlayers: PlayerStat[] = [
    { name: 'PlayerA', rating: 1.1, kills: 22, deaths: 18 },
    { name: 'PlayerB', rating: 1.05, kills: 20, deaths: 17 },
    { name: 'PlayerC', rating: 0.98, kills: 18, deaths: 19 },
  ]
  return {
    win,
    rounds,
    attackWinRate,
    defenseWinRate,
    topPlayers,
    notes: 'Placeholder analytics. Replace with real calculations later.',
  }
}

export type { MatchAnalytics as TMatchAnalytics }
