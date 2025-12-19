'use client'

import { useState, useEffect } from 'react'
import type { EvidenceV1 } from '@/models/Match'

interface EvidencePanelProps {
  matchId: string
}

interface MatchWithEvidence {
  matchId: string
  meta: {
    seriesId: string
    tournamentId: string
    map: string
    opponentName: string
    eventName: string
    games: Array<{ gameId: string; mapName: string; sequenceNumber: number }>
  }
  evidence: EvidenceV1 | null
  evidenceMeta: {
    extractedAt: string
    version: string
    extractor?: string
  } | null
}

export function EvidencePanel({ matchId }: EvidencePanelProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MatchWithEvidence | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvidence() {
      try {
        const res = await fetch(`/api/coach/match?matchId=${matchId}`)

        if (!res.ok) {
          let msg = 'Failed to fetch evidence'
          try {
            const errorData = await res.json()
            if (errorData?.error) msg = errorData.error
          } catch {
            // ignore JSON parse error
          }
          throw new Error(msg)
        }

        const matchData = await res.json()
        setData(matchData)
      } catch (err: unknown) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unexpected error')
      } finally {
        setLoading(false)
      }
    }

    fetchEvidence()
  }, [matchId])

  if (loading) {
    return (
      <section className="rounded-lg border bg-white shadow-sm p-6">
        <p className="text-sm text-gray-600">Loading evidence...</p>
      </section>
    )
  }

  if (error || !data?.evidence) {
    return (
      <section className="rounded-lg border bg-white shadow-sm p-6">
        <p className="text-sm text-gray-600">
          {error || 'No evidence available for this match yet.'}
        </p>
      </section>
    )
  }

  const { evidence } = data

  return (
    <div className="space-y-4">
      {/* Map Summary */}
      <section className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Map Summary</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {evidence.games.map((game, idx) => {
              const gameRounds = evidence.rounds.filter((r) => r.gameId === game.gameId)
              return (
                <div key={game.gameId} className="rounded-lg border bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-700">
                    Game {idx + 1}: {game.mapName}
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mt-1">
                    {gameRounds.length} rounds
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* First Blood Stats */}
      {evidence.derived?.firstBloodStats && evidence.derived.firstBloodStats.length > 0 && (
        <section className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900">First Blood Stats</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-900">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-4 py-3 font-semibold text-center">First Bloods</th>
                  <th className="px-4 py-3 font-semibold text-center">Rounds Won</th>
                  <th className="px-4 py-3 font-semibold text-center">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {evidence.derived.firstBloodStats.map((stat: any) => (
                  <tr key={stat.teamId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{stat.teamName}</td>
                    <td className="px-4 py-3 text-center">{stat.firstBloods}</td>
                    <td className="px-4 py-3 text-center">{stat.roundsWon}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {(stat.conversionRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Plant Stats */}
      {evidence.derived?.plantStats && evidence.derived.plantStats.length > 0 && (
        <section className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900">Plant Stats</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-900">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-4 py-3 font-semibold text-center">Plants</th>
                  <th className="px-4 py-3 font-semibold text-center">Post-Plant Wins</th>
                  <th className="px-4 py-3 font-semibold text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {evidence.derived.plantStats.map((stat: any) => (
                  <tr key={stat.teamId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{stat.teamName}</td>
                    <td className="px-4 py-3 text-center">{stat.plants}</td>
                    <td className="px-4 py-3 text-center">{stat.postPlantWins}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {(stat.postPlantWinRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Isolated Deaths */}
      {evidence.players && evidence.players.length > 0 && (
        <section className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-lg font-medium text-gray-900">
              Isolated Deaths (Top 5 Players)
            </h2>
            <p className="text-sm text-gray-600">
              Deaths occurring far from teammates (threshold: {evidence.meta.isoThreshold || 2500} units)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-900">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold">Player ID</th>
                  <th className="px-4 py-3 font-semibold text-center">Team ID</th>
                  <th className="px-4 py-3 font-semibold text-center">Isolated Deaths</th>
                  <th className="px-4 py-3 font-semibold text-center">Total Deaths</th>
                  <th className="px-4 py-3 font-semibold text-center">Isolation %</th>
                </tr>
              </thead>
              <tbody>
                {evidence.players
                  .sort((a, b) => b.isolatedDeathsCount - a.isolatedDeathsCount)
                  .slice(0, 5)
                  .map((player) => (
                    <tr key={player.playerId} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">Player {player.playerId}</td>
                      <td className="px-4 py-3 text-center">{player.teamId}</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">
                        {player.isolatedDeathsCount}
                      </td>
                      <td className="px-4 py-3 text-center">{player.deaths}</td>
                      <td className="px-4 py-3 text-center">
                        {player.deaths > 0
                          ? ((player.isolatedDeathsCount / player.deaths) * 100).toFixed(1)
                          : '0.0'}
                        %
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Evidence Metadata */}
      {data.evidenceMeta && (
        <div className="text-xs text-gray-500 text-right">
          Evidence extracted: {new Date(data.evidenceMeta.extractedAt).toLocaleString()} •
          Version: {data.evidenceMeta.version}
        </div>
      )}
    </div>
  )
}
