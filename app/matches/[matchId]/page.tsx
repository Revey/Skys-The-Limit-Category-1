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
        <InfoCard label="Rounds Won" value={roundsWon.toString()} />
        <InfoCard label="Rounds Lost" value={roundsLost.toString()} />
      </section>

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Players</h2>
          <p className="text-xs text-gray-500">Kills / deaths / assists with K/D ratio</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Kills</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Deaths</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Assists</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">K/D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map((player) => (
                <tr key={player.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{player.name}</td>
                  <td className="px-4 py-2 text-gray-700">{player.kills}</td>
                  <td className="px-4 py-2 text-gray-700">{player.deaths}</td>
                  <td className="px-4 py-2 text-gray-700">{player.assists}</td>
                  <td className="px-4 py-2 text-gray-700">{player.kd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}
