import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { requireAuth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'

type Params = { params: { matchId: string } }

export default async function MatchDetailPage({ params }: Params) {
  requireAuth()
  await connectToDatabase()

  const match = (await Match.findById(params.matchId).lean()) as unknown as MatchDocument | null

  if (!match) {
    return (
      <div className="rounded-lg border p-6 text-center text-gray-700">
        Match not found.
      </div>
    )
  }

  const analytics = computeMatchAnalytics(match)
  const totalRounds = analytics.rounds
  const roundsWon = analytics.win ? 13 : Math.max(totalRounds - 13, 0)
  const roundsLost = analytics.win ? Math.max(totalRounds - 13, 0) : 13

  const players = analytics.topPlayers.map((player) => {
    const assists =
      (match as any)?.rawData?.players?.find((p: any) => p.name === player.name)?.assists ?? 0
    const kd = player.deaths === 0 ? player.kills : player.kills / player.deaths

    return {
      name: player.name,
      kills: player.kills,
      deaths: player.deaths,
      assists,
      kd,
    }
  })

  return (
    <div className="space-y-8">
      <header className="space-y-1 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{match.map}</h1>
        <p className="text-sm text-gray-600">
          vs {match.opponentName} • {match.eventName} • {new Date(match.date).toLocaleDateString()}
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
