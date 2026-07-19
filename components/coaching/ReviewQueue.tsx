import Link from 'next/link'
import type {
  ReviewCategory,
  ReviewItem,
  ReviewSeverity,
} from '@/lib/analytics/computeReviewQueue'

interface ReviewQueueProps {
  items: ReviewItem[]
}

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  throw: 'Throws',
  lost_anti_eco: 'Anti-eco losses',
  opponent_clutch: 'Opponent clutches',
  lost_post_plant: 'Lost post-plants',
  critical_round: 'Critical rounds',
}

const BADGE_LABELS: Record<ReviewCategory, string> = {
  throw: 'Throw',
  lost_anti_eco: 'Anti-eco',
  opponent_clutch: 'Opponent clutch',
  lost_post_plant: 'Post-plant',
  critical_round: 'Critical',
}

const SEVERITY_STYLES: Record<ReviewSeverity, string> = {
  5: 'border-red-500/40 bg-red-500/15 text-red-300',
  4: 'border-orange-500/40 bg-orange-500/15 text-orange-300',
  3: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
  2: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
}

const SEVERITY_LABELS: Record<ReviewSeverity, string> = {
  5: 'Severity 5 · Immediate review',
  4: 'Severity 4 · High priority',
  3: 'Severity 3 · Tactical breakdown',
  2: 'Severity 2 · Review opportunity',
}

const SEVERITIES: ReviewSeverity[] = [5, 4, 3, 2]

function formatDate(date?: string): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

export function ReviewQueue({ items }: ReviewQueueProps) {
  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-xl font-semibold text-white">No review rounds found</h2>
        <p className="mt-2 text-sm text-gray-400">
          The recent series do not contain any of the configured review triggers.
        </p>
      </div>
    )
  }

  const categoryCounts = items.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1
    return counts
  }, {} as Partial<Record<ReviewCategory, number>>)

  return (
    <div className="space-y-8">
      <section className="card p-6" aria-label="Review queue summary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Queue summary</h2>
            <p className="mt-1 text-sm text-gray-400">{items.length} rounds ready for VOD review</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as ReviewCategory[]).map(category => {
              const count = categoryCounts[category]
              if (!count) return null
              return (
                <span
                  key={category}
                  className="rounded-full border border-gray-700 bg-black/30 px-3 py-1.5 text-xs text-gray-300"
                >
                  {CATEGORY_LABELS[category]}: <span className="font-semibold text-white">{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {SEVERITIES.map(severity => {
        const severityItems = items.filter(item => item.severity === severity)
        if (severityItems.length === 0) return null

        return (
          <section key={severity} aria-labelledby={`review-severity-${severity}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={`review-severity-${severity}`} className="text-lg font-semibold text-white">
                {SEVERITY_LABELS[severity]}
              </h2>
              <span className="text-sm text-gray-500">{severityItems.length} rounds</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
              {severityItems.map(item => (
                <Link
                  key={`${item.matchId}-${item.gameId}-${item.roundNumber}`}
                  href={`/matches/${encodeURIComponent(item.matchId)}`}
                  className="grid gap-3 border-b border-gray-800/80 p-4 transition-colors last:border-0 hover:bg-white/5 md:grid-cols-[110px_minmax(140px,0.8fr)_minmax(120px,0.7fr)_80px_minmax(240px,2fr)] md:items-center"
                >
                  <span className="text-sm text-gray-400">{formatDate(item.date)}</span>
                  <span className="truncate font-medium text-white">
                    vs {item.opponentName}
                  </span>
                  <span className="capitalize text-gray-300">{item.mapName}</span>
                  <span className="font-mono text-sm text-gray-300">Round {item.roundNumber}</span>
                  <span className="min-w-0">
                    <span className={`mr-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${SEVERITY_STYLES[severity]}`}>
                      {BADGE_LABELS[item.category]}
                    </span>
                    <span className="text-sm text-gray-200">{item.reason}</span>
                    {item.detail !== item.reason && (
                      <span className="mt-1 block text-xs text-gray-500">{item.detail}</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
