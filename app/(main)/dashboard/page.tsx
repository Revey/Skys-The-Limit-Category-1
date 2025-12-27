import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CLOUD9_TEAM_ID = '79'

interface SeriesResult {
  seriesId: string
  opponent: string
  c9MapsWon: number
  opponentMapsWon: number
  isWin: boolean
  games: Array<{
    mapName: string
    c9Rounds: number
    opponentRounds: number
  }>
}

interface DashboardStats {
  totalSeries: number
  seriesWins: number
  seriesLosses: number
  mapsPlayed: Record<string, number>
  attackWinRate: number
  defenseWinRate: number
  recentSeries: SeriesResult[]
}

function computeDashboardStats(matches: MatchDocument[]): DashboardStats {
  const c9Matches = matches.filter(match => {
    const mapsStats = match.analytics?.evidence_v1?.derived?.mapsStats
    if (!mapsStats) return false
    return mapsStats.some((stat: any) => stat.teamId === CLOUD9_TEAM_ID)
  })

  const seriesMap = new Map<string, MatchDocument>()
  for (const match of c9Matches) {
    const seriesId = match.gridSeriesId
    if (seriesId && !seriesMap.has(seriesId)) {
      seriesMap.set(seriesId, match)
    }
  }

  const seriesResults: SeriesResult[] = []
  let seriesWins = 0
  let seriesLosses = 0
  const mapsPlayed: Record<string, number> = {}
  let totalAttackWins = 0
  let totalAttackRounds = 0
  let totalDefenseWins = 0
  let totalDefenseRounds = 0

  for (const [seriesId, match] of seriesMap) {
    const evidence = match.analytics?.evidence_v1
    if (!evidence) continue

    const mapsStats = evidence.derived?.mapsStats || []
    const games = evidence.games || []
    const gameStats = new Map<string, { c9: any; opponent: any }>()
    
    for (const stat of mapsStats) {
      const gameId = stat.gameId
      if (!gameStats.has(gameId)) {
        gameStats.set(gameId, { c9: null, opponent: null })
      }
      if (stat.teamId === CLOUD9_TEAM_ID) {
        gameStats.get(gameId)!.c9 = stat
      } else {
        gameStats.get(gameId)!.opponent = stat
      }
    }

    let c9MapsWon = 0
    let opponentMapsWon = 0
    let opponentName = match.opponentName || 'Unknown'
    const gameResults: SeriesResult['games'] = []

    for (const game of games) {
      const stats = gameStats.get(game.gameId)
      if (!stats?.c9 || !stats?.opponent) continue
      mapsPlayed[game.mapName] = (mapsPlayed[game.mapName] || 0) + 1
      const c9Rounds = stats.c9.roundsWon
      const oppRounds = stats.opponent.roundsWon
      opponentName = stats.opponent.teamName
      gameResults.push({ mapName: game.mapName, c9Rounds, opponentRounds: oppRounds })
      if (c9Rounds > oppRounds) c9MapsWon++
      else if (oppRounds > c9Rounds) opponentMapsWon++
    }

    const isWin = c9MapsWon > opponentMapsWon
    if (c9MapsWon !== opponentMapsWon) {
      if (isWin) seriesWins++
      else seriesLosses++
    }

    seriesResults.push({ seriesId, opponent: opponentName, c9MapsWon, opponentMapsWon, isWin, games: gameResults })

    const rounds = evidence.rounds || []
    for (const round of rounds) {
      const winnerSide = round.winnerSide
      const winnerTeamId = round.winnerTeamId
      if (winnerSide === 'attack') {
        totalAttackRounds++
        if (winnerTeamId === CLOUD9_TEAM_ID) totalAttackWins++
      } else if (winnerSide === 'defense') {
        totalDefenseRounds++
        if (winnerTeamId === CLOUD9_TEAM_ID) totalDefenseWins++
      }
    }
  }

  return {
    totalSeries: seriesMap.size,
    seriesWins,
    seriesLosses,
    mapsPlayed,
    attackWinRate: totalAttackRounds > 0 ? totalAttackWins / totalAttackRounds : 0,
    defenseWinRate: totalDefenseRounds > 0 ? totalDefenseWins / totalDefenseRounds : 0,
    recentSeries: seriesResults.slice(0, 10)
  }
}

export default async function DashboardPage() {
  await requireAuth()
  await connectToDB()

  const matches = (await Match.aggregate([
    { $match: { 'analytics.evidence_v1': { $exists: true } } },
    { $sort: { _id: -1 } }
  ])) as unknown as MatchDocument[]

  const stats = computeDashboardStats(matches)
  const winRate = stats.totalSeries > 0 ? ((stats.seriesWins / stats.totalSeries) * 100).toFixed(0) : '0'

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            Cloud9 Team <span className="text-blue-400">Overview</span>
          </h1>
          <p className="text-gray-400">Performance snapshot across {stats.totalSeries} series</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Series Played" value={stats.totalSeries} color="blue" delay={0} />
          <StatCard title="Series Wins" value={stats.seriesWins} color="green" delay={100} />
          <StatCard title="Series Losses" value={stats.seriesLosses} color="red" delay={200} />
          <StatCard title="Win Rate" value={`${winRate}%`} color="cyan" delay={300} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Map Breakdown */}
          <div className="card p-6 animate-slide-in-left" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-white mb-6">Map Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(stats.mapsPlayed)
                .sort((a, b) => b[1] - a[1])
                .map(([mapName, count], index) => (
                  <div 
                    key={mapName} 
                    className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-all cursor-pointer"
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <span className="text-gray-300 capitalize">{mapName}</span>
                    <span className="text-blue-400 font-medium">{count} games</span>
                  </div>
                ))}
              {Object.keys(stats.mapsPlayed).length === 0 && (
                <p className="text-gray-500 italic">No matches recorded yet.</p>
              )}
            </div>
          </div>

          {/* Side Win Rate */}
          <div className="card p-6 animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-white mb-6">Side Win Rate</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Attack</span>
                  <span className="text-gray-300 font-medium">{(stats.attackWinRate * 100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill-attack transition-all duration-1000"
                    style={{ width: `${stats.attackWinRate * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Defense</span>
                  <span className="text-gray-300 font-medium">{(stats.defenseWinRate * 100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill-defense transition-all duration-1000"
                    style={{ width: `${stats.defenseWinRate * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Series Table */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Recent Series</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Opponent</th>
                  <th className="text-center py-4 px-6 text-gray-400 font-medium">Result</th>
                  <th className="text-center py-4 px-6 text-gray-400 font-medium">Maps</th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSeries.length === 0 ? (
                  <tr>
                    <td className="py-6 px-6 text-gray-500 text-center" colSpan={4}>
                      No series found.
                    </td>
                  </tr>
                ) : (
                  stats.recentSeries.map((series, index) => (
                    <tr 
                      key={series.seriesId} 
                      className="table-row"
                      style={{ animationDelay: `${500 + index * 50}ms` }}
                    >
                      <td className="py-4 px-6 text-gray-300 font-medium">{series.opponent}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={series.isWin ? 'badge-win' : 'badge-loss'}>
                          {series.isWin ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {series.isWin ? 'WIN' : 'LOSS'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-400">
                        {series.c9MapsWon} - {series.opponentMapsWon}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/matches/opponent/${encodeURIComponent(series.opponent)}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-800">
            <Link 
              href="/matches" 
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1"
            >
              View all opponents <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  color,
  delay = 0
}: { 
  title: string
  value: number | string
  color: 'blue' | 'green' | 'red' | 'cyan'
  delay?: number
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400'
  }
  
  return (
    <div 
      className="card card-hover p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className={`text-4xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}
