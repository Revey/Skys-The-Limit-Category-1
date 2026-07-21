'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { TeamLogo } from '@/components/ui/TeamLogo'
import { getTournamentMeta } from '@/lib/tournaments'

export interface OpponentRow {
  name: string
  seriesWins: number
  seriesLosses: number
  mapsWon: number
  mapsLost: number
  seriesCount: number
  latestTournamentId: string
  latestResult: 'W' | 'L'
}

interface OpponentListProps {
  rows: OpponentRow[]
}

export function OpponentList({ rows }: OpponentListProps) {
  const [query, setQuery] = useState('')
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return rows

    return rows.filter(row => row.name.toLocaleLowerCase().includes(normalizedQuery))
  }, [query, rows])

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <label htmlFor="opponent-search" className="sr-only">
          Search opponents
        </label>
        <input
          id="opponent-search"
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search opponents"
          className="input-field py-2.5"
        />
      </div>

      <div className="space-y-2">
        {filteredRows.map(row => {
          const lastPlayed = getTournamentMeta(row.latestTournamentId)?.month ?? '—'
          const resultClasses = row.latestResult === 'W'
            ? 'border-green-500/30 bg-green-500/15 text-green-400'
            : 'border-red-500/30 bg-red-500/15 text-red-400'

          return (
            <Link
              key={row.name}
              href={`/matches/opponent/${encodeURIComponent(row.name)}`}
              className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 backdrop-blur transition-colors hover:border-[#00aeef]/50 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_6rem_7rem_7rem_auto_auto]"
              aria-label={`View ${row.name}: ${row.seriesWins}-${row.seriesLosses} across ${row.seriesCount} series`}
            >
              <TeamLogo teamName={row.name} size="sm" />

              <div className="min-w-0">
                <div className="truncate font-semibold text-white transition-colors group-hover:text-[#00aeef]">
                  {row.name}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500 md:hidden">
                  <span>Series {row.seriesWins}-{row.seriesLosses}</span>
                  <span>Maps {row.mapsWon}-{row.mapsLost}</span>
                  <span>{lastPlayed}</span>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-xs uppercase tracking-wide text-gray-500">Series</div>
                <div className="text-sm font-medium text-gray-200">
                  {row.seriesWins}-{row.seriesLosses}
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-xs uppercase tracking-wide text-gray-600">Maps</div>
                <div className="text-sm text-gray-400">
                  {row.mapsWon}-{row.mapsLost}
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-xs uppercase tracking-wide text-gray-600">Last played</div>
                <div className="text-sm text-gray-400">{lastPlayed}</div>
              </div>

              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${resultClasses}`}>
                {row.latestResult}
              </span>

              <ChevronRight
                className="h-4 w-4 text-gray-600 transition-colors group-hover:text-[#00aeef]"
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </div>

      {filteredRows.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 px-6 py-12 text-center text-gray-500">
          No opponents match “{query.trim()}”.
        </div>
      )}
    </div>
  )
}
