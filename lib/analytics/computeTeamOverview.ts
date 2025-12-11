import type { MatchDocument } from '@/models/Match'

export type MapCount = { map: string; count: number }

export type TeamOverviewStats = {
  totalMatches: number
  wins: number
  losses: number
  mapsPlayed: MapCount[]
  attackWinRate: number
  defenseWinRate: number
}

export function computeTeamOverview(matches: MatchDocument[]): TeamOverviewStats {
  const total = matches.length
  // Placeholder logic: alternate wins/losses
  let wins = 0
  let losses = 0
  matches.forEach((_, idx) => {
    if (idx % 2 === 0) wins++
    else losses++
  })

  const mapCounts: Record<string, number> = {}
  for (const m of matches) {
    mapCounts[m.map] = (mapCounts[m.map] || 0) + 1
  }
  const mapsPlayed: MapCount[] = Object.entries(mapCounts).map(([map, count]) => ({ map, count }))

  const attackWinRate = total ? Math.round((wins / total) * 100) : 0
  const defenseWinRate = total ? 100 - attackWinRate : 0

  return { totalMatches: total, wins, losses, mapsPlayed, attackWinRate, defenseWinRate }
}

export type { TeamOverviewStats as TTeamOverviewStats }
