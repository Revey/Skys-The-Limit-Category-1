import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'

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

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label="Result" value={analytics.win ? 'Win' : 'Loss'} />
        <InfoCard label="Rounds" value={String(analytics.rounds)} />
        <InfoCard label="Attack/Defense" value={`${analytics.attackWinRate}% / ${analytics.defenseWinRate}%`} />
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-2">Top Players (placeholder)</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          {analytics.topPlayers.map((p) => (
            <li key={p.name}>
              {p.name}: {p.kills}/{p.deaths} — rating {p.rating}
            </li>
          ))}
        </ul>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-medium mb-2">Notes</h2>
        <p className="text-sm text-gray-700">{analytics.notes}</p>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
