'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'

interface CoachPanelProps {
  matchId: string
  selectedGameId?: string // Sync with parent's map selection
}

interface GameInfo {
  gameId: string
  mapName: string
  sequenceNumber: number
}

// Simple markdown renderer for coaching reports
function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      elements.push(
        <ListTag key={elements.length} className={listType === 'ul' ? 'list-disc pl-6 space-y-2 my-3' : 'list-decimal pl-6 space-y-2 my-3'}>
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-300" dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ListTag>
      )
      listItems = []
      listType = null
    }
  }

  const formatInline = (text: string): string => {
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    text = text.replace(/__(.+?)__/g, '<strong class="font-semibold text-white">$1</strong>')
    text = text.replace(/\*(.+?)\*/g, '<em class="text-blue-400">$1</em>')
    text = text.replace(/_(.+?)_/g, '<em class="text-blue-400">$1</em>')
    return text
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      const headerText = trimmed.slice(3).toUpperCase()
      let headerColor = 'text-blue-400'
      if (headerText.includes('EVIDENCE')) headerColor = 'text-cyan-400'
      if (headerText.includes('INSIGHT')) headerColor = 'text-purple-400'
      if (headerText.includes('RECOMMENDATION')) headerColor = 'text-green-400'
      
      elements.push(
        <h2 key={elements.length} className={`text-lg font-bold ${headerColor} mt-6 mb-3 pb-2 border-b border-gray-700`}>
          {headerText}
        </h2>
      )
      continue
    }

    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={elements.length} className="text-xl font-bold text-white mt-6 mb-4">
          {trimmed.slice(2)}
        </h1>
      )
      continue
    }

    const numberedMatch = trimmed.match(/^\d+[\.\)]\s+(.+)$/)
    if (numberedMatch) {
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listItems.push(numberedMatch[1])
      continue
    }

    const bulletMatch = trimmed.match(/^[\-\*•]\s+(.+)$/)
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(bulletMatch[1])
      continue
    }

    flushList()
    elements.push(
      <p key={elements.length} className="text-gray-300 my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
    )
  }

  flushList()

  return <>{elements}</>
}

export function CoachPanel({ matchId, selectedGameId: externalGameId }: CoachPanelProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingGames, setFetchingGames] = useState(true)
  const [games, setGames] = useState<GameInfo[]>([])
  const [report, setReport] = useState<string | null>(null)
  const [reportGameId, setReportGameId] = useState<string | null>(null) // Track which game the report is for
  const [error, setError] = useState<string | null>(null)

  // Use external game ID if provided
  const selectedGameId = externalGameId || games[0]?.gameId || null

  // Fetch available games for this match
  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch(`/api/coach/match?matchId=${matchId}`)
        if (res.ok) {
          const data = await res.json()
          if (data?.evidence?.games) {
            setGames(data.evidence.games)
          }
        }
      } catch (err) {
        console.error('Failed to fetch games:', err)
      } finally {
        setFetchingGames(false)
      }
    }
    fetchGames()
  }, [matchId])

  // Clear report when map changes
  useEffect(() => {
    if (reportGameId && reportGameId !== selectedGameId) {
      setReport(null)
      setReportGameId(null)
    }
  }, [selectedGameId, reportGameId])

  async function handleGenerate() {
    if (!selectedGameId) return
    
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch('/api/coach/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, gameId: selectedGameId }),
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
      setReportGameId(selectedGameId)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const selectedGame = games.find(g => g.gameId === selectedGameId)

  return (
    <section className="card backdrop-blur-xl bg-gray-900/70">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Coaching Report</h2>
            <p className="text-sm text-gray-400">
              Generate insights for <span className="text-purple-400 capitalize">{selectedGame?.mapName || 'selected map'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !selectedGameId || fetchingGames}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating report for {selectedGame?.mapName}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Coaching Report
            </>
          )}
        </button>

        {error && (
          <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
            <div className="flex items-center gap-2 text-red-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              Error generating report
            </div>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        )}

        {report && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-purple-500 rounded-full" />
              <h3 className="text-lg font-semibold text-white capitalize">
                Coaching Report: {selectedGame?.mapName}
              </h3>
            </div>
            <div className="p-6 rounded-lg bg-black/40 border border-gray-700">
              <div className="prose prose-sm prose-invert max-w-none">
                {renderMarkdown(report)}
              </div>
            </div>
          </div>
        )}

        {!report && !loading && !error && (
          <p className="text-sm text-gray-500">
            Click the button above to generate an AI coaching report with 
            <strong className="text-cyan-400"> Evidence</strong>, 
            <strong className="text-purple-400"> Insights</strong>, and 
            <strong className="text-green-400"> Recommendations</strong> for the selected map.
          </p>
        )}
      </div>
    </section>
  )
}
