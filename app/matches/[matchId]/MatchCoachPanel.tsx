'use client'

import { useState } from 'react'

type MatchCoachPanelProps = {
  matchId: string
  analyticsSummary?: string
}

export function MatchCoachPanel({ matchId, analyticsSummary }: MatchCoachPanelProps) {
  const [report, setReport] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateReport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/coach-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = (await response.json()) as { report?: string }
      setReport(data.report ?? 'No report returned.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate report')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-4 rounded-lg border p-4 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Coaching Report</h2>
        <p className="text-sm text-gray-600">Generate a quick coaching summary for this match.</p>
        {analyticsSummary ? (
          <p className="text-xs text-gray-500">Analytics summary: {analyticsSummary}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isLoading ? 'Generating...' : 'Generate coaching report'}
        </button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>

      {report ? (
        <div className="max-h-64 overflow-y-auto rounded-md border bg-gray-50 p-3 text-sm text-gray-800">
          {report}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No report generated yet.</p>
      )}
    </section>
  )
}
