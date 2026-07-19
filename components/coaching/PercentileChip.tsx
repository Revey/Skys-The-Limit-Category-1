import type { PercentileResult } from '@/lib/analytics/leagueBenchmarks'

// League-context chip: green = top quartile, red = bottom quartile.
export function PercentileChip({ result }: { result: PercentileResult | null }) {
  if (!result) return null
  const tone =
    result.percentile >= 75
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : result.percentile < 25
        ? 'bg-red-500/15 text-red-400 border-red-500/30'
        : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tone}`}>
        P{result.percentile} of {result.teamCount}
      </span>
      <span className="text-[10px] text-gray-500">
        league median {(result.median * 100).toFixed(0)}%
      </span>
    </span>
  )
}
