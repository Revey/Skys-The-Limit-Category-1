import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { CoachPanel } from './CoachPanel'
import { EvidencePanel } from './EvidencePanel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ matchId: string }> }

export default async function MatchDetailPage({ params }: Props) {
  await requireAuth()
  const { matchId } = await params
  await connectToDB()

  const match = (await Match.findById(matchId).lean()) as unknown as MatchDocument | null

  if (!match) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-gray-700 shadow-sm">
        Match not found.
      </div>
    )
  }

  const analytics = computeMatchAnalytics(match)

  return (
    <div className="space-y-8">
      <header className="space-y-1 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{analytics.map}</h1>
        <p className="text-sm text-gray-600">
          vs {analytics.opponentName} • {analytics.eventName} • {analytics.date}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Rounds Won" value={analytics.teamRoundsWon} />
        <SummaryCard label="Rounds Lost" value={analytics.teamRoundsLost} />
        <SummaryCard label="Rounds Played" value={analytics.roundsPlayed} />
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-medium text-gray-900">Player Stats</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold text-center">K</th>
                <th className="px-4 py-3 font-semibold text-center">D</th>
                <th className="px-4 py-3 font-semibold text-center">KD</th>
              </tr>
            </thead>
            <tbody>
              {analytics.players.map((player) => (
                <tr key={player.name} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{player.name}</td>
                  <td className="px-4 py-3 text-center">{player.kills}</td>
                  <td className="px-4 py-3 text-center">{player.deaths}</td>
                  <td className="px-4 py-3 text-center font-medium">
                    {player.kd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <EvidencePanel matchId={matchId} />

      <CoachPanel matchId={matchId} />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}
