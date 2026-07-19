import { aggregateTeamTendencies } from '@/lib/analytics/aggregateTeamTendencies'
import type {
  SeriesDerivedInput,
  TeamTendencies,
} from '@/lib/analytics/aggregateTeamTendencies'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'

export type MetricKey =
  | 'pistolWR'
  | 'bonusConversion'
  | 'antiEcoWR'
  | 'ecoUpsetWR'
  | 'fullBuyWR'
  | 'afterLossForceRate'
  | 'fastTempoWR'
  | 'slowTempoWR'
  | 'attackPistolWR'
  | 'defensePistolWR'

type MetricValue = { value: number; n: number }

export interface BenchmarkValue extends MetricValue {
  teamId: string
}

export interface PercentileResult {
  percentile: number
  teamCount: number
  median: number
}

export interface LeagueBenchmarks {
  distributions: Record<MetricKey, BenchmarkValue[]>
  percentileFor: (
    teamId: string,
    metric: MetricKey
  ) => PercentileResult | null
}

const METRIC_KEYS: MetricKey[] = [
  'pistolWR',
  'bonusConversion',
  'antiEcoWR',
  'ecoUpsetWR',
  'fullBuyWR',
  'afterLossForceRate',
  'fastTempoWR',
  'slowTempoWR',
  'attackPistolWR',
  'defensePistolWR',
]

function metric(value: number, n: number): MetricValue | null {
  return n > 0 && Number.isFinite(value) && Number.isFinite(n)
    ? { value, n }
    : null
}

function winRate(
  bucket: { rounds: number; wins: number } | undefined
): MetricValue | null {
  return bucket
    ? metric(bucket.wins / bucket.rounds, bucket.rounds)
    : null
}

export function extractMetrics(
  tendencies: TeamTendencies
): Record<MetricKey, MetricValue | null> {
  const eco = tendencies.economy.byTier.eco
  const save = tendencies.economy.byTier.save
  const ecoRounds = (eco?.rounds ?? 0) + (save?.rounds ?? 0)
  const ecoWins = (eco?.wins ?? 0) + (save?.wins ?? 0)
  const afterLossBuckets = Object.values(tendencies.economy.afterLoss)
  const afterLossRounds = afterLossBuckets.reduce(
    (total, bucket) => total + bucket.rounds,
    0
  )
  const afterLossForceRounds =
    tendencies.economy.afterLoss.half_buy?.rounds ?? 0

  return {
    pistolWR: metric(
      tendencies.pistols.overall.rate,
      tendencies.pistols.overall.denominator
    ),
    bonusConversion: metric(
      tendencies.pistols.bonusConversion.rate,
      tendencies.pistols.bonusConversion.denominator
    ),
    antiEcoWR: metric(
      tendencies.antiEco.winRate.rate,
      tendencies.antiEco.winRate.denominator
    ),
    ecoUpsetWR: metric(ecoWins / ecoRounds, ecoRounds),
    fullBuyWR: winRate(tendencies.economy.byTier.full_buy),
    afterLossForceRate: metric(
      afterLossForceRounds / afterLossRounds,
      afterLossRounds
    ),
    fastTempoWR: winRate(tendencies.tempo.byTempo.fast),
    slowTempoWR: winRate(tendencies.tempo.byTempo.slow),
    attackPistolWR: metric(
      tendencies.pistols.attack.rate,
      tendencies.pistols.attack.denominator
    ),
    defensePistolWR: metric(
      tendencies.pistols.defense.rate,
      tendencies.pistols.defense.denominator
    ),
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

export function computeLeagueBenchmarks(
  list: Array<{ teamId: string; tendencies: TeamTendencies }>
): LeagueBenchmarks {
  const distributions = Object.fromEntries(
    METRIC_KEYS.map(metricKey => [
      metricKey,
      list.flatMap(({ teamId, tendencies }) => {
        const extracted = extractMetrics(tendencies)[metricKey]
        return extracted && extracted.n >= 30
          ? [{ teamId, ...extracted }]
          : []
      }),
    ])
  ) as Record<MetricKey, BenchmarkValue[]>

  return {
    distributions,
    percentileFor(teamId, metricKey) {
      const distribution = distributions[metricKey]
      const target = distribution.find(entry => entry.teamId === teamId)
      if (!target) return null

      const otherTeams = distribution.filter(entry => entry.teamId !== teamId)
      if (otherTeams.length === 0) return null

      const lower = otherTeams.filter(entry => entry.value < target.value).length
      const tied = otherTeams.filter(entry => entry.value === target.value).length

      return {
        percentile: Math.round(((lower + 0.5 * tied) / otherTeams.length) * 100),
        teamCount: distribution.length,
        median: median(distribution.map(entry => entry.value)),
      }
    },
  }
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

let leagueBenchmarksPromise: Promise<LeagueBenchmarks> | null = null

export function getLeagueBenchmarks(): Promise<LeagueBenchmarks> {
  if (!leagueBenchmarksPromise) {
    leagueBenchmarksPromise = (async () => {
      await connectToDB()
      const docs = await Match.find(
        { 'analytics.evidence_v1.derived.mapsStats.0': { $exists: true } },
        { map: 1, 'analytics.evidence_v1.derived': 1 }
      ).lean()

      const grouped = new Map<string, SeriesDerivedInput[]>()

      for (const rawDoc of docs as unknown[]) {
        const doc = object(rawDoc)
        const analytics = object(doc?.analytics)
        const evidence = object(analytics?.evidence_v1)
        const derived = object(evidence?.derived)
        const mapsStats = Array.isArray(derived?.mapsStats)
          ? derived.mapsStats
          : []
        const teamIds = new Set<string>()

        for (const rawMapStats of mapsStats) {
          const mapStats = object(rawMapStats)
          if (typeof mapStats?.teamId === 'string' && mapStats.teamId.trim()) {
            teamIds.add(mapStats.teamId.trim())
          }
        }

        const series: SeriesDerivedInput = {
          map: typeof doc?.map === 'string' ? doc.map : null,
          derived: derived as SeriesDerivedInput['derived'],
        }

        for (const teamId of teamIds) {
          const teamSeries = grouped.get(teamId) ?? []
          teamSeries.push(series)
          grouped.set(teamId, teamSeries)
        }
      }

      return computeLeagueBenchmarks(
        Array.from(grouped, ([teamId, series]) => ({
          teamId,
          tendencies: aggregateTeamTendencies(series, teamId),
        }))
      )
    })()
  }

  return leagueBenchmarksPromise
}
