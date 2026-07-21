'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ScoutReportPanel } from '@/components/coaching/ScoutReportPanel'
import { TendencyMatrix } from '@/components/coaching/TendencyMatrix'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RateMetric, TeamTendencies } from '@/lib/analytics/aggregateTeamTendencies'
import type { PercentileResult } from '@/lib/analytics/leagueBenchmarks'

interface OpponentSeries {
  seriesId: string
  matchId: string
  c9MapsWon: number
  opponentMapsWon: number
  isWin: boolean
  tournament: string
  estimatedDate: string
  games: Array<{
    gameId: string
    mapName: string
    c9Rounds: number
    opponentRounds: number
    c9Won: boolean
  }>
}

interface OpponentDetailTabsProps {
  opponentTeamId: string
  opponentTeamName: string
  tendencies: TeamTendencies
  pistolPercentile?: PercentileResult | null
  antiEcoPercentile?: PercentileResult | null
  series: OpponentSeries[]
}

interface RankedTendency {
  label: string
  metric: RateMetric
}

const HISTORY_PREVIEW_COUNT = 3

function titleCase(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function rankedTendencies(tendencies: TeamTendencies): RankedTendency[] {
  const candidates: RankedTendency[] = [
    { label: 'Pistol win rate', metric: tendencies.pistols.overall },
    { label: 'Attack pistol win rate', metric: tendencies.pistols.attack },
    { label: 'Defense pistol win rate', metric: tendencies.pistols.defense },
    { label: 'Bonus conversion', metric: tendencies.pistols.bonusConversion },
    { label: 'Lost to force', metric: tendencies.pistols.lostToForce },
    { label: 'After-loss force rate', metric: tendencies.economy.afterLossForceRate },
    { label: 'Late plant rate', metric: tendencies.tempo.latePlantRate },
    { label: 'Early aggression rate', metric: tendencies.tempo.earlyAggressionRate },
    { label: 'Anti-eco win rate', metric: tendencies.antiEco.winRate },
    ...tendencies.mapPool.map(map => ({
      label: `${titleCase(map.map)} map win rate`,
      metric: map.winRate,
    })),
    ...Object.entries(tendencies.economy.byTier).map(([tier, bucket]) => ({
      label: `${titleCase(tier)} win rate`,
      metric: bucket.winRate,
    })),
    ...Object.entries(tendencies.tempo.byTempo).map(([tempo, bucket]) => ({
      label: `${titleCase(tempo)} tempo win rate`,
      metric: bucket.winRate,
    })),
    ...tendencies.sites.flatMap(site => [
      { label: `Site ${site.site.toUpperCase()} preference`, metric: site.preferenceShare },
      { label: `Site ${site.site.toUpperCase()} post-plant win rate`, metric: site.postPlantWinRate },
      { label: `Site ${site.site.toUpperCase()} defense win rate`, metric: site.defenseWinRate },
    ]),
    { label: 'Spike plant rate', metric: tendencies.spikeCarriers.plantRate },
    { label: 'Spike carrier death rate', metric: tendencies.spikeCarriers.carrierDeathRate },
  ]

  return candidates
    .filter(candidate => candidate.metric.denominator > 0)
    .sort((a, b) => b.metric.denominator - a.metric.denominator)
    .slice(0, 3)
}

export function OpponentDetailTabs({
  opponentTeamId,
  opponentTeamName,
  tendencies,
  pistolPercentile,
  antiEcoPercentile,
  series,
}: OpponentDetailTabsProps) {
  const [showAllHistory, setShowAllHistory] = useState(false)
  const topTendencies = useMemo(() => rankedTendencies(tendencies), [tendencies])
  const visibleSeries = showAllHistory ? series : series.slice(0, HISTORY_PREVIEW_COUNT)

  return (
    <Tabs defaultValue="scout" className="animate-fade-in-up">
      <TabsList className="w-full justify-start overflow-x-auto border border-gray-800 bg-black/30">
        <TabsTrigger value="scout">Scout</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="all-data">All data</TabsTrigger>
      </TabsList>

      <TabsContent value="scout" className="space-y-6">
        <section aria-labelledby="top-tendencies-title" className="card p-5">
          <div className="mb-4">
            <h2 id="top-tendencies-title" className="text-xl font-semibold text-white">
              Highest-confidence tendencies
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              The three rate signals backed by the largest samples.
            </p>
          </div>

          {topTendencies.length === 0 ? (
            <p className="text-sm italic text-gray-500">No derived tendency samples available.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {topTendencies.map(({ label, metric }) => (
                <article key={label} className="rounded-lg border border-gray-800 bg-black/20 p-4">
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#00aeef]">
                    {(metric.rate * 100).toFixed(0)}%{' '}
                    <span className="text-sm font-medium text-gray-400">
                      ({formatCount(metric.numerator)}/{formatCount(metric.denominator)})
                    </span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <ScoutReportPanel
          opponentTeamId={opponentTeamId}
          opponentTeamName={opponentTeamName}
        />
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Match history</h2>
          <p className="mt-1 text-sm text-gray-500">Sorted by most recent first</p>
        </div>

        <div className="space-y-3">
          {visibleSeries.map(match => (
            <Link
              key={match.seriesId}
              href={`/matches/${match.matchId}`}
              className="card group block p-4 transition-colors hover:border-[#00aeef]/50"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="min-w-0 lg:w-72">
                  <p className="truncate text-sm font-medium text-white">{match.tournament}</p>
                  <p className="text-xs text-gray-500">{match.estimatedDate}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${
                      match.isWin
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {match.isWin ? 'W' : 'L'}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {match.c9MapsWon}-{match.opponentMapsWon}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:justify-end">
                  {match.games.map(game => (
                    <span
                      key={game.gameId}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        game.c9Won
                          ? 'border-green-500/25 bg-green-500/10'
                          : 'border-red-500/25 bg-red-500/10'
                      }`}
                    >
                      <span className="capitalize text-gray-200">{game.mapName}</span>
                      <span className={game.c9Won ? 'text-green-400' : 'text-red-400'}>
                        {game.c9Rounds}-{game.opponentRounds}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {series.length > HISTORY_PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setShowAllHistory(current => !current)}
            className="text-sm font-medium text-[#00aeef] transition-colors hover:text-[#29bdf3]"
          >
            {showAllHistory ? 'Show latest 3' : `Show all (${series.length})`}
          </button>
        )}
      </TabsContent>

      <TabsContent value="all-data">
        <TendencyMatrix
          teamName={opponentTeamName}
          tendencies={tendencies}
          pistolPercentile={pistolPercentile}
          antiEcoPercentile={antiEcoPercentile}
        />
      </TabsContent>
    </Tabs>
  )
}
