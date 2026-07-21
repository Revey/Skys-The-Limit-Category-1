'use client'

import { useEffect, useMemo, useState } from 'react'
import type { EvidenceV1 } from '@/lib/types/evidence'
import {
  computeGlanceIndicators,
  type IndicatorTone,
} from '@/lib/analytics/glanceMetrics'

interface KeyIndicatorsProps {
  matchId: string
  teamId: string
  teamName: string
  selectedGameId?: string
}

const toneClasses: Record<IndicatorTone, string> = {
  accent: 'text-[#00aeef]',
  good: 'text-green-400',
  bad: 'text-red-400',
}

export function KeyIndicators({
  matchId,
  teamId,
  teamName,
  selectedGameId,
}: KeyIndicatorsProps) {
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

  const indicators = useMemo(
    () =>
      evidence
        ? computeGlanceIndicators(evidence, teamId, selectedGameId)
        : [],
    [evidence, selectedGameId, teamId]
  )

  if (!loaded) return null

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#00aeef]">
          Key indicators
        </h2>
        <span className="truncate text-xs text-gray-500">{teamName}</span>
      </div>

      {indicators.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {indicators.map(indicator => (
            <div
              key={indicator.key}
              className="min-w-0 rounded-lg border border-gray-800 bg-black/30 px-4 py-3"
            >
              <p className="truncate text-xs font-medium text-gray-400">{indicator.label}</p>
              <p className={`mt-1 text-2xl font-bold ${toneClasses[indicator.tone]}`}>
                {indicator.value}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">{indicator.sample}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">Not enough data for key indicators.</p>
      )}
    </section>
  )
}
