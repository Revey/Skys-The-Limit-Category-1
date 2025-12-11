import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { MatchCoachPanel } from './MatchCoachPanel'

type Params = { params: { matchId: string } }

export default async function MatchDetailPage({ params }: Params) {
  requireAuth()
  await connectToDB()
  const match = (await Match.findById(params.matchId).populate('team').lean()) as unknown as MatchDocument | null
  if (!match) {
    return <div>Match not found.</div>
  }
  const analytics = computeMatchAnalytics(match)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Match Detail</h1>
        <p className="text-gray-700">
          {new Date(match.date).toLocaleDateString()} • {match.eventName} • {match.map} vs {match.opponentName}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard label="Result" value={analytics.win ? 'Win' : 'Loss'} />
        <InfoCard label="Rounds" value={String(analytics.rounds)} />
        <InfoCard label="Attack/Defense" value={`${analytics.attackWinRate}% / ${analytics.defenseWinRate}%`} />
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Top Players (placeholder)</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          {analytics.topPlayers.map((p) => (
            <li key={p.name}>
              {p.name}: {p.kills}/{p.deaths} — rating {p.rating}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Notes</h2>
        <p className="text-sm text-gray-700">{analytics.notes}</p>
      </section>

      <MatchCoachPanel matchId={params.matchId} analyticsSummary={analytics.notes} />
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
