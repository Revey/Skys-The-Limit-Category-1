'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Play, Star, Target, Trophy, Zap } from 'lucide-react'
import type { Highlight } from '@/lib/analytics/computeHighlights'

interface HighlightReelProps {
  highlights: Highlight[]
  focusTeamName: string
  opponentName: string
  onRoundSelect?: (roundNumber: number, gameId: string) => void
}

const HIGHLIGHT_META: Record<Highlight['type'], {
  label: string
  icon: ReactNode
  color: string
}> = {
  clutch: {
    label: 'Clutch won',
    icon: <Trophy className="w-5 h-5 text-purple-400" />,
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/50',
  },
  multikill: {
    label: 'Multi-kill',
    icon: <Target className="w-5 h-5 text-blue-400" />,
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/50',
  },
  eco_upset: {
    label: 'Eco upset',
    icon: <Zap className="w-5 h-5 text-green-400" />,
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/50',
  },
}

export default function HighlightReel({
  highlights,
  focusTeamName,
  opponentName,
  onRoundSelect
}: HighlightReelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [highlights])

  if (highlights.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 text-center">
        <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No highlights detected in this match</p>
        <p className="text-gray-500 text-sm mt-1">
          Highlights are derived from won clutches, 3K+ rounds, and eco upsets
        </p>
      </div>
    )
  }

  const currentIndex = Math.min(selectedIndex, highlights.length - 1)
  const currentHighlight = highlights[currentIndex]
  const meta = HIGHLIGHT_META[currentHighlight.type]
  const attributedTeamName = currentHighlight.teamName || (
    currentHighlight.isFocusTeam ? focusTeamName : opponentName
  )

  const goToPrevious = () => {
    setSelectedIndex(previous => previous > 0 ? previous - 1 : highlights.length - 1)
  }

  const goToNext = () => {
    setSelectedIndex(previous => previous < highlights.length - 1 ? previous + 1 : 0)
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Match Highlights
        </h3>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {highlights.length}
        </span>
      </div>

      <div className={`bg-gradient-to-br ${meta.color} rounded-lg border p-6 mb-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {meta.icon}
            <span className="text-xl font-bold text-white">{meta.label}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            currentHighlight.isFocusTeam
              ? 'bg-blue-500/20 text-blue-300'
              : 'bg-gray-700/80 text-gray-300'
          }`}>
            {attributedTeamName}
          </span>
        </div>

        <p className="text-white text-lg mb-4">{currentHighlight.label}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {currentHighlight.mapName && (
            <div>
              <p className="text-gray-400">Map</p>
              <p className="text-white font-semibold">{currentHighlight.mapName}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400">Round</p>
            <p className="text-white font-semibold">Round {currentHighlight.roundNumber}</p>
          </div>
          {currentHighlight.playerName && (
            <div>
              <p className="text-gray-400">Player</p>
              <p className="text-white font-semibold">{currentHighlight.playerName}</p>
            </div>
          )}
        </div>

        {onRoundSelect && (
          <button
            onClick={() => onRoundSelect(currentHighlight.roundNumber, currentHighlight.gameId)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <Play className="w-4 h-4" />
            View Round Details
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Previous highlight"
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>

        <div className="flex gap-2">
          {highlights.slice(0, 10).map((highlight, index) => (
            <button
              type="button"
              key={`${highlight.gameId}-${highlight.roundNumber}-${highlight.type}-${index}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show highlight ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
          {highlights.length > 10 && (
            <span className="text-gray-500 text-xs">+{highlights.length - 10}</span>
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          aria-label="Next highlight"
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <p className="text-lg font-bold text-purple-400">
            {highlights.filter(highlight => highlight.type === 'clutch').length}
          </p>
          <p className="text-xs text-gray-400">Clutches</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">
            {highlights.filter(highlight => highlight.type === 'multikill').length}
          </p>
          <p className="text-xs text-gray-400">Multi-kills</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-400">
            {highlights.filter(highlight => highlight.type === 'eco_upset').length}
          </p>
          <p className="text-xs text-gray-400">Eco Wins</p>
        </div>
      </div>
    </div>
  )
}
