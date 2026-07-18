'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  prepareEconomyTimeline,
  type EconomyTimelinePoint,
} from '@/lib/analytics/prepareEconomyTimeline'
import type { EconomyRound, GameInfo } from '@/lib/types/evidence'

interface EconomyTimelineProps {
  economyRounds: EconomyRound[]
  games: GameInfo[]
  selectedGameId?: string
  teamId: string
  teamName: string
  opponentTeamId: string
  opponentName: string
}

const ECONOMY_TIERS: Record<string, { min: number; color: string; label: string }> = {
  full_buy: { min: 3900, color: '#10B981', label: 'Full Buy' },
  half_buy: { min: 2600, color: '#F59E0B', label: 'Half Buy' },
  eco: { min: 1500, color: '#EF4444', label: 'Eco' },
  save: { min: 0, color: '#6B7280', label: 'Save' }
}

export default function EconomyTimeline({
  economyRounds,
  games,
  selectedGameId,
  teamId,
  teamName,
  opponentTeamId,
  opponentName
}: EconomyTimelineProps) {
  const { points: chartData, separators } = useMemo(
    () => prepareEconomyTimeline(economyRounds, games, {
      teamId,
      opponentTeamId,
      selectedGameId,
    }),
    [economyRounds, games, teamId, opponentTeamId, selectedGameId]
  )

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: EconomyTimelinePoint }>
  }) => {
    if (!active || !payload?.length) return null

    const data = payload[0].payload
    const getTierLabel = (tier: string) => ECONOMY_TIERS[tier]?.label || tier
    const getTierColor = (tier: string) => ECONOMY_TIERS[tier]?.color || '#888'

    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">
          {data.mapName} · Round {data.roundNumber}
        </p>

        <div className="space-y-2">
          <div>
            <p className="text-blue-400 text-sm">{teamName}</p>
            <p className="text-white">
              {data.teamEconomy == null ? 'N/A' : `$${data.teamEconomy.toLocaleString()}`}
              {data.teamTier && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: getTierColor(data.teamTier), color: 'white' }}
                >
                  {getTierLabel(data.teamTier)}
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="text-red-400 text-sm">{opponentName}</p>
            <p className="text-white">
              {data.opponentEconomy == null ? 'N/A' : `$${data.opponentEconomy.toLocaleString()}`}
              {data.opponentTier && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: getTierColor(data.opponentTier), color: 'white' }}
                >
                  {getTierLabel(data.opponentTier)}
                </span>
              )}
            </p>
          </div>
        </div>

        {data.teamWon !== undefined && (
          <p className={`mt-2 text-sm ${data.teamWon ? 'text-green-400' : 'text-red-400'}`}>
            {data.teamWon ? '✓ Round Won' : '✗ Round Lost'}
          </p>
        )}
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-gray-400">No economy data available</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Economy Timeline</h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

            <ReferenceArea y1={0} y2={1500} fill="#6B7280" fillOpacity={0.08} />
            <ReferenceArea y1={1500} y2={2600} fill="#EF4444" fillOpacity={0.07} />
            <ReferenceArea y1={2600} y2={3900} fill="#F59E0B" fillOpacity={0.07} />
            <ReferenceArea y1={3900} y2={9000} fill="#10B981" fillOpacity={0.06} />

            <XAxis
              dataKey="roundLabel"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 'auto']}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />

            <ReferenceLine y={3900} stroke="#10B981" strokeDasharray="5 5" />
            <ReferenceLine y={1500} stroke="#EF4444" strokeDasharray="5 5" />
            {separators.map(separator => (
              <ReferenceLine
                key={separator.roundLabel}
                x={separator.roundLabel}
                stroke="#9CA3AF"
                strokeOpacity={0.45}
                strokeDasharray="3 4"
                label={{
                  value: separator.mapName,
                  position: 'insideTopRight',
                  fill: '#9CA3AF',
                  fontSize: 10,
                }}
              />
            ))}

            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="linear"
              dataKey="teamEconomy"
              name={teamName}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="linear"
              dataKey="opponentEconomy"
              name={opponentName}
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-300">
        {Object.entries(ECONOMY_TIERS).map(([key, tier]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: tier.color }} />
            {tier.label} (${tier.min.toLocaleString()}+)
          </span>
        ))}
      </div>
    </div>
  )
}
