'use client'

import { useState } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'

interface ScoutReportPanelProps {
  opponentTeamId: string
}

interface ScoutReportResponse {
  report: string
  generatedAt: string
}

function isSectionTitle(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('#') || /^[A-Z][A-Z\s/&-]{3,}:?$/.test(trimmed)
}

function ReportText({ report }: { report: string }) {
  return (
    <div className="space-y-4 text-sm leading-6 text-gray-300">
      {report.split(/\n{2,}/).map((block, blockIndex) => (
        <div key={`${block.slice(0, 32)}-${blockIndex}`} className="space-y-1 whitespace-pre-wrap">
          {block.split('\n').map((line, lineIndex) => {
            const title = isSectionTitle(line)
            const content = title ? line.replace(/^#{1,6}\s*/, '') : line

            return title ? (
              <strong key={lineIndex} className="block text-base text-white">
                {content}
              </strong>
            ) : (
              <span key={lineIndex} className="block">
                {content}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function ScoutReportPanel({ opponentTeamId }: ScoutReportPanelProps) {
  const [result, setResult] = useState<ScoutReportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateReport() {
    setLoading(true)
    setError(null)
    setCopied(false)

    try {
      const response = await fetch('/api/scout-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: opponentTeamId }),
      })
      const data = await response.json() as Partial<ScoutReportResponse> & { message?: string }

      if (!response.ok || !data.report || !data.generatedAt) {
        throw new Error(data.message || 'Unable to generate the scouting report.')
      }

      setResult({ report: data.report, generatedAt: data.generatedAt })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate the scouting report.')
    } finally {
      setLoading(false)
    }
  }

  async function copyReport() {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result.report)
      setCopied(true)
      setError(null)
    } catch {
      setError('Unable to copy the report to the clipboard.')
    }
  }

  return (
    <section aria-labelledby="scout-report-title" className="card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="scout-report-title" className="text-xl font-semibold text-white">
            AI Scouting Report
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Evidence-linked opponent analysis from the tendency matrix.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              type="button"
              onClick={copyReport}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-500 hover:text-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00aeef] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#29bdf3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Generating…' : 'Generate scouting report'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="border-t border-gray-800 pt-4">
          <ReportText report={result.report} />
          <p className="mt-5 text-xs text-gray-500">
            Generated {new Date(result.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  )
}
