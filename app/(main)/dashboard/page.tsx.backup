import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { DashboardStats as DashboardStatsModel, type DashboardStatsDocument } from '@/models/DashboardStats'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalSeries: number
  seriesWins: number
  seriesLosses: number
  mapsPlayed: Record<string, number>
  attackWinRate: number
  defenseWinRate: number
  recentSeries: Array<{
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
  }>
  strugglingAgainst: Array<{
    name: string
    seriesWins: number
    seriesLosses: number
    mapsWon: number
    mapsLost: number
  }>
}

/**
 * Convert DashboardStatsDocument from MongoDB to DashboardStats interface
 */
function convertDashboardStats(doc: DashboardStatsDocument | null): DashboardStats {
  if (!doc) {
    // Return empty stats if no data exists
    return {
      totalSeries: 0,
      seriesWins: 0,
      seriesLosses: 0,
      mapsPlayed: {},
      attackWinRate: 0,
      defenseWinRate: 0,
      recentSeries: [],
      strugglingAgainst: [],
    }
  }

  // Convert MongoDB Map to plain object
  const mapsPlayed: Record<string, number> = {}
  if (doc.mapsPlayed instanceof Map) {
    doc.mapsPlayed.forEach((value, key) => {
      mapsPlayed[key] = value
    })
  } else {
    Object.assign(mapsPlayed, doc.mapsPlayed || {})
    if (mapsStats.length === 0) return false
    return mapsStats.some(stat => stat.teamId === CLOUD9_TEAM_ID)
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
  const opponentRecords = new Map<string, OpponentRecord>()

  for (const [seriesId, match] of seriesMap) {
    const evidence = match.analytics?.evidence_v1
    if (!evidence) continue

    const mapsStats = getMapsStats(evidence)
    const games = evidence.games || []
    const gameStats = new Map<string, { c9: MapStat | null; opponent: MapStat | null }>()
    
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
      // Normalize opponent name to remove any "(1)" suffixes
      opponentName = normalizeTeamName(stats.opponent.teamName)
      gameResults.push({ mapName: game.mapName, c9Rounds, opponentRounds: oppRounds })
      if (c9Rounds > oppRounds) c9MapsWon++
      else if (oppRounds > c9Rounds) opponentMapsWon++
    }

    const isWin = c9MapsWon > opponentMapsWon
    if (c9MapsWon !== opponentMapsWon) {
      if (isWin) seriesWins++
      else seriesLosses++

      // Track opponent records
      if (!opponentRecords.has(opponentName)) {
        opponentRecords.set(opponentName, {
          opponent: opponentName,
          wins: 0,
          losses: 0,
          mapsWon: 0,
          mapsLost: 0
        })
      }
      const record = opponentRecords.get(opponentName)!
      if (isWin) {
        record.wins++
        record.mapsWon += c9MapsWon
        record.mapsLost += opponentMapsWon
      } else {
        record.losses++
        record.mapsWon += c9MapsWon
        record.mapsLost += opponentMapsWon
      }
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

  // Get teams we struggle against (lost more series than won)
  const strugglingAgainst = Array.from(opponentRecords.values())
    .filter(record => record.losses > record.wins)
    .sort((a, b) => b.losses - a.losses)
    .slice(0, 5)

  return {
    totalSeries: seriesMap.size,
    seriesWins,
    seriesLosses,
    mapsPlayed,
    attackWinRate: totalAttackRounds > 0 ? totalAttackWins / totalAttackRounds : 0,
    defenseWinRate: totalDefenseRounds > 0 ? totalDefenseWins / totalDefenseRounds : 0,
    recentSeries: seriesResults.slice(0, 10),
    strugglingAgainst
  }
}

export default async function DashboardPage() {
  console.log('[DASHBOARD] Starting page render...')
  const startTime = Date.now()
  
  await requireAuth()
  console.log('[DASHBOARD] Auth check completed in', Date.now() - startTime, 'ms')
  
  await connectToDB()
  console.log('[DASHBOARD] DB connection completed in', Date.now() - startTime, 'ms')

  // Only fetch the fields we need for dashboard stats to speed up query
  const matches = (await Match.aggregate([
    // Filter: Only matches with evidence (uses index)
    {
      $match: {
        'analytics.evidence_v1.derived.mapsStats': { $exists: true }
      }
    },

    // Sort + Limit: Recent matches only (uses index)
    { $sort: { _id: -1 } },
    { $limit: 100 },  // Limit to ~50 series worth of data

    // Project: Only fields actually used in computeDashboardStats()
    {
      $project: {
        gridSeriesId: 1,
        opponentName: 1,
        'analytics.evidence_v1.derived.mapsStats': 1,
        'analytics.evidence_v1.games.gameId': 1,
        'analytics.evidence_v1.games.mapName': 1,
        'analytics.evidence_v1.rounds.winnerSide': 1,
        'analytics.evidence_v1.rounds.winnerTeamId': 1
      }
    }
  ])) as unknown as MatchDocument[]
  
  console.log('[DASHBOARD] Query completed in', Date.now() - startTime, 'ms, found', matches.length, 'matches')

  const stats = computeDashboardStats(matches)
  const winRate = stats.totalSeries > 0 ? ((stats.seriesWins / stats.totalSeries) * 100).toFixed(0) : '0'

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 relative">
      {/* VCT Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/VCT2026.png"
          alt="VCT Background"
          fill
          className="object-cover opacity-5"
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            Cloud9 Team <span className="text-[#00aeef]">Overview</span>
          </h1>
          <p className="text-gray-400">Performance snapshot - Last {stats.totalSeries} series</p>
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
                    <span className="text-[#00aeef] font-medium">{count} games</span>
                  </div>
                ))}
              {Object.keys(stats.mapsPlayed).length === 0 && (
                <p className="text-gray-500 italic">No matches recorded yet.</p>
              )}
            </div>
          </div>

          {/* Struggling Against */}
          <div className="card p-6 animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-semibold text-white mb-6">Struggling Against</h2>
            <div className="space-y-3">
              {stats.strugglingAgainst.length > 0 ? (
                stats.strugglingAgainst.map((record, index) => {
                  const winRate = record.wins + record.losses > 0
                    ? ((record.wins / (record.wins + record.losses)) * 100).toFixed(0)
                    : '0'
                  return (
                    <Link
                      key={record.opponent}
                      href={`/matches/opponent/${encodeURIComponent(record.opponent)}`}
                      className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-all cursor-pointer"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <div className="flex-1">
                        <div className="text-gray-300 font-medium">{record.opponent}</div>
                        <div className="text-sm text-gray-500">
                          {record.wins}W - {record.losses}L ({record.mapsWon}-{record.mapsLost} maps)
                        </div>
                      </div>
                      <div className="text-red-400 font-semibold text-lg ml-4">
                        {winRate}%
                      </div>
                    </Link>
                  )
                })
              ) : (
                <p className="text-gray-500 italic">No struggling opponents. Great performance!</p>
              )}
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
                          className="text-[#00aeef] hover:text-[#00c8ff] transition-colors inline-flex items-center gap-1"
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
              className="text-[#00aeef] hover:text-[#00c8ff] transition-colors font-medium inline-flex items-center gap-1"
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
    blue: 'text-[#00aeef]',
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
