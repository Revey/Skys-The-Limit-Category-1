import type { MatchDocument } from '@/models/Match'

export interface TeamOverviewStats {
  totalMatches: number
  wins: number
  losses: number
  mapsPlayed: Record<string, number>
  attackWinRate: number
  defenseWinRate: number
}

export function computeTeamOverview(matches: MatchDocument[]): TeamOverviewStats {
  const totalMatches = matches.length
  const wins = Math.round(totalMatches * 0.5)
  const losses = totalMatches - wins

  const mapsPlayed: Record<string, number> = {}
  for (const match of matches) {
    mapsPlayed[match.map] = (mapsPlayed[match.map] || 0) + 1
  }

  const attackWinRate = 0.5
  const defenseWinRate = 0.5

  return {
    totalMatches,
    wins,
    losses,
    mapsPlayed,
    attackWinRate,
    defenseWinRate,
  }
}
