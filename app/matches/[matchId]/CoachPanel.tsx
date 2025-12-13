'use client'

import { useState } from 'react'

interface CoachPanelProps {
  matchId: string
}

export function CoachPanel({ matchId }: CoachPanelProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch('/api/coach/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      })

      if (!res.ok) {
        let msg = 'Failed to generate report'
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch {
          // ignore JSON parse error
        }
        throw new Error(msg)
      }

      const data = await res.json()
      setReport(data.report ?? '')
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-medium text-gray-900">AI Coaching Report</h2>
        <p className="text-sm text-gray-600">
          Generate AI-powered coaching insights for this match.
        </p>
      </div>

      <div className="p-4 space-y-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {loading ? 'Generating coaching report...' : 'Generate coaching report'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {report && (
          <div className="mt-4 p-4 border rounded-md bg-gray-50 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {report}
          </div>
        )}

        {!report && !loading && !error && (
          <p className="text-sm text-gray-500">
            Click the button above to generate an AI coaching report based on
            match analytics.
          </p>
        )}
      </div>
    </section>
  )
}
