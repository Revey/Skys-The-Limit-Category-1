'use client'

import { useEffect, useMemo, useState } from 'react'
import type { EvidenceV1 } from '@/lib/types/evidence'
import { computeRoundsToReview } from '@/lib/analytics/glanceMetrics'

interface RoundsToReviewProps {
  matchId: string
  teamId: string
  selectedGameId?: string
}

export function RoundsToReview({
  matchId,
  teamId,
  selectedGameId,
}: RoundsToReviewProps) {
  const [evidence, setEvidence] = useState<EvidenceV1 | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchEvidence() {
      setLoaded(false)
      try {
        const response = await fetch(
          `/api/coach/match?matchId=${encodeURIComponent(matchId)}&teamId=${encodeURIComponent(teamId)}`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error('Failed to fetch match evidence')

        const data = (await response.json()) as { evidence?: EvidenceV1 | null }
        setEvidence(data.evidence || null)
      } catch {
        if (!controller.signal.aborted) setEvidence(null)
      } finally {
        if (!controller.signal.aborted) setLoaded(true)
      }
    }

    fetchEvidence()
    return () => controller.abort()
  }, [matchId, teamId])

  const rounds = useMemo(
    () =>
      evidence
        ? computeRoundsToReview(evidence, teamId, selectedGameId)
        : [],
    [evidence, selectedGameId, teamId]
  )

  if (!loaded || rounds.length === 0) return null

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 backdrop-blur-xl">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-200">
          Rounds to review
        </h2>
        <p className="mt-1 text-xs text-gray-500">Full round timeline in Advanced data below</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {rounds.map(round => (
          <div
            key={`${round.gameId}:${round.roundNumber}`}
            className="min-w-[180px] flex-1 rounded-lg border border-gray-800 bg-black/30 px-4 py-3"
          >
            <p className="text-sm font-semibold text-[#00aeef]">Round {round.roundNumber}</p>
            <p className="mt-1 truncate text-xs text-gray-400" title={round.reason}>
              {round.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
