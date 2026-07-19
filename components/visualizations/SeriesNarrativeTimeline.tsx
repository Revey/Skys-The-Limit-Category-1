'use client'

import { useMemo } from 'react'
import type { Highlight } from '@/lib/analytics/computeHighlights'
import type { GameInfo, ManAdvantageStat, RoundInfo } from '@/lib/types/evidence'

interface SeriesNarrativeTimelineProps {
  rounds: RoundInfo[]
  games: GameInfo[]
  teamId: string
  teamName: string
  opponentName: string
  highlights: Highlight[]
  manAdvantageStats?: ManAdvantageStat[]
}

interface NarrativeRound extends RoundInfo {
  won: boolean
  score: {
    team: number
    opponent: number
  }
  highlightLabels: string[]
  throwLabels: string[]
}

function roundKey(gameId: string, roundNumber: number): string {
  return `${gameId}:${roundNumber}`
}

function formatWinType(winType?: string): string {
  if (!winType) return 'Unknown'

  return winType
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, value => value.toUpperCase())
}

export default function SeriesNarrativeTimeline({
  rounds,
  games,
  teamId,
  teamName,
  opponentName,
  highlights,
  manAdvantageStats = [],
}: SeriesNarrativeTimelineProps) {
  const gameRows = useMemo(() => {
    const gameById = new Map(games.map(game => [game.gameId, game]))
    const orderedGameIds = games.map(game => game.gameId)

    for (const round of rounds) {
      if (!gameById.has(round.gameId) && !orderedGameIds.includes(round.gameId)) {
        orderedGameIds.push(round.gameId)
      }
    }

    const highlightLabelsByRound = new Map<string, string[]>()
    for (const highlight of highlights) {
      if (!highlight.isFocusTeam || highlight.teamId !== teamId) continue

      const key = roundKey(highlight.gameId, highlight.roundNumber)
      const labels = highlightLabelsByRound.get(key) || []
      labels.push(highlight.label)
      highlightLabelsByRound.set(key, labels)
    }

    const throwLabelsByRound = new Map<string, string[]>()
    const focusTeamManAdvantage = manAdvantageStats.find(stat => stat.teamId === teamId)
    for (const throwRound of focusTeamManAdvantage?.throwStats.throwRounds || []) {
      const key = roundKey(throwRound.gameId, throwRound.roundNumber)
      const labels = throwLabelsByRound.get(key) || []
      labels.push(`Lost from ${throwRound.situation} man advantage`)
      throwLabelsByRound.set(key, labels)
    }

    return orderedGameIds
      .map((gameId, gameIndex) => {
        let teamScore = 0
        let opponentScore = 0
        const gameRounds: NarrativeRound[] = rounds
          .filter(round => round.gameId === gameId)
          .sort((a, b) => a.roundNumber - b.roundNumber)
          .map(round => {
            const won = round.winnerTeamId === teamId
            if (won) teamScore += 1
            else opponentScore += 1

            const key = roundKey(round.gameId, round.roundNumber)
            return {
              ...round,
              won,
              score: { team: teamScore, opponent: opponentScore },
              highlightLabels: highlightLabelsByRound.get(key) || [],
              throwLabels: throwLabelsByRound.get(key) || [],
            }
          })

        return {
          gameId,
          mapName: gameById.get(gameId)?.mapName || `Map ${gameIndex + 1}`,
          rounds: gameRounds,
        }
      })
      .filter(game => game.rounds.length > 0)
  }, [games, highlights, manAdvantageStats, rounds, teamId])

  if (gameRows.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-gray-400">No round data available</p>
      </div>
    )
  }

  return (
    <div className="min-w-0 bg-gray-900/50 rounded-xl border border-gray-700 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-lg font-semibold text-white">Series Narrative</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          <span><span className="text-yellow-300">★</span> Highlight</span>
          <span><span className="text-orange-300">⚠</span> Throw</span>
          <span><span className="text-blue-300">▲</span> Plant</span>
        </div>
      </div>

      <div className="space-y-5">
        {gameRows.map(game => {
          const roundNumbers = new Set(game.rounds.map(round => round.roundNumber))
          const gridTemplateColumns = `repeat(${game.rounds.length}, minmax(40px, 1fr))`

          return (
            <section key={game.gameId} aria-label={`${game.mapName} round narrative`}>
              <p className="mb-2 text-sm font-medium text-gray-200">{game.mapName}</p>
              <div className="max-w-full overflow-x-auto pb-1">
                <div className="min-w-full" style={{ width: `${game.rounds.length * 44}px` }}>
                  <div className="grid gap-1" style={{ gridTemplateColumns }}>
                    {game.rounds.map(round => {
                      const markerLabels = [
                        ...round.highlightLabels.map(label => `★ Highlight: ${label}`),
                        ...round.throwLabels.map(label => `⚠ Throw: ${label}`),
                        ...(round.hadPlant ? ['▲ Plant happened'] : []),
                      ]
                      const tooltip = [
                        `Round ${round.roundNumber}`,
                        `Score: ${teamName} ${round.score.team}-${round.score.opponent} ${opponentName}`,
                        `Win type: ${formatWinType(round.winType)}`,
                        ...markerLabels,
                      ].join('\n')

                      return (
                        <div
                          key={round.roundNumber}
                          title={tooltip}
                          aria-label={tooltip.replace(/\n/g, '. ')}
                          className={`relative flex h-11 items-start justify-center rounded-sm border pt-1 transition-colors ${
                            round.won
                              ? 'border-green-500/30 bg-green-600/30 hover:bg-green-600/45'
                              : 'border-red-500/30 bg-red-600/30 hover:bg-red-600/45'
                          }`}
                        >
                          <span className="flex min-h-4 items-center justify-center gap-px text-[10px] leading-none">
                            {round.highlightLabels.length > 0 && (
                              <span className="text-yellow-300" aria-hidden="true">★</span>
                            )}
                            {round.throwLabels.length > 0 && (
                              <span className="text-orange-300" aria-hidden="true">⚠</span>
                            )}
                            {round.hadPlant && (
                              <span className="text-blue-300" aria-hidden="true">▲</span>
                            )}
                          </span>
                          {round.roundNumber % 5 === 0 && (
                            <span className="absolute inset-x-0 bottom-1 text-center font-mono text-[10px] text-gray-300">
                              {round.roundNumber}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div
                    className="grid h-5 gap-1 text-[9px] uppercase tracking-wide text-gray-500"
                    style={{ gridTemplateColumns }}
                    aria-hidden="true"
                  >
                    {game.rounds.map(round => {
                      const isHalfBoundary = round.roundNumber === 12 && roundNumbers.has(13)
                      const isOvertimeBoundary = round.roundNumber === 24 && roundNumbers.has(25)

                      return (
                        <div key={round.roundNumber} className="relative">
                          {(isHalfBoundary || isOvertimeBoundary) && (
                            <>
                              <span className="absolute -right-[3px] top-0 h-2 border-r border-gray-400" />
                              <span className="absolute left-full top-2 -translate-x-1/2 whitespace-nowrap">
                                {isHalfBoundary ? 'Half · 12 | 13' : 'OT · 24 | 25'}
                              </span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
