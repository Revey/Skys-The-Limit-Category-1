'use client'

import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  buildWinProbabilityTimeline,
  type WinProbabilityGame,
  type WinProbabilityPoint,
  type WinProbabilityRound,
} from '@/lib/analytics/winProbability'

interface WinProbabilityTimelineProps {
  rounds: WinProbabilityRound[]
  teamId: string
  teamName: string
  opponentName: string
  games: WinProbabilityGame[]
}

export default function WinProbabilityTimeline({
  rounds,
  teamId,
  teamName,
  opponentName,
  games
}: WinProbabilityTimelineProps) {
  const chartData = useMemo(
    () => buildWinProbabilityTimeline(rounds, games, teamId),
    [rounds, games, teamId]
  )

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: WinProbabilityPoint }>
  }) => {
    if (!active || !payload?.length) return null

    const data = payload[0].payload

    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold">
          {data.mapName} · {data.round === 0 ? 'Map start' : `Round ${data.round}`}
        </p>
        <p className="text-gray-300">Score: {data.score}</p>
        <p className={`font-bold ${data.winProb >= 50 ? 'text-green-400' : 'text-red-400'}`}>
          {teamName} win probability: {data.winProb}%
        </p>
        {data.clutch && (
          <p className={`text-sm ${data.clutch.isFocusTeam ? 'text-yellow-400' : 'text-gray-400'}`}>
            ⚡ {data.clutch.playerName} won {data.clutch.situation}
          </p>
        )}
        {data.isCritical && <p className="text-orange-400 text-sm">🔥 Critical Round</p>}
        {data.momentumShift && <p className="text-purple-400 text-sm">📈 Momentum Shift</p>}
      </div>
    )
  }

  const CustomDot = ({
    cx,
    cy,
    payload,
  }: {
    cx?: number
    cy?: number
    payload?: WinProbabilityPoint
  }) => {
    if (cx == null || cy == null || !payload) return null

    if (payload.clutch) {
      const fill = payload.clutch.isFocusTeam ? '#EAB308' : '#6B7280'
      const stroke = payload.clutch.isFocusTeam ? '#FDE047' : '#D1D5DB'
      return <circle cx={cx} cy={cy} r={6} fill={fill} stroke={stroke} strokeWidth={2} />
    }
    if (payload.isCritical) {
      return <circle cx={cx} cy={cy} r={5} fill="#F97316" stroke="#FB923C" strokeWidth={2} />
    }
    if (payload.momentumShift) {
      return <circle cx={cx} cy={cy} r={5} fill="#A855F7" stroke="#C084FC" strokeWidth={2} />
    }

    return null
  }

  if (rounds.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-gray-400">No round data available</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-white">Win Probability Timeline</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            {teamName} clutch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-500" />
            {opponentName} clutch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            Momentum
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="winProbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="roundLabel" stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine
              y={50}
              stroke="#6B7280"
              strokeDasharray="5 5"
              label={{ value: '50%', position: 'right', fill: '#9CA3AF', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="linear"
              dataKey="winProb"
              stroke="transparent"
              fill="url(#winProbGradient)"
            />
            <Line
              type="linear"
              dataKey="winProb"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#3B82F6', stroke: '#60A5FA', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {games.map((game, index) => (
          <span
            key={game.gameId}
            className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300"
          >
            Map {index + 1}: {game.mapName}
          </span>
        ))}
      </div>
    </div>
  )
}
