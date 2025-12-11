import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { computeTeamOverview, type TeamOverviewStats } from '@/lib/analytics/computeTeamOverview'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  requireAuth()
  await connectToDB()

  const matches = (await Match.find().sort({ date: -1 }).lean()) as unknown as MatchDocument[]
  const overview: TeamOverviewStats = computeTeamOverview(matches)

  const mapEntries = Object.entries(overview.mapsPlayed)

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Team Overview</h1>
        <p className="text-sm text-gray-600 mt-1">Snapshot of recent match performance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Matches" value={overview.totalMatches} />
        <SummaryCard title="Wins" value={overview.wins} />
        <SummaryCard title="Losses" value={overview.losses} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Map Breakdown</h2>
          {mapEntries.length === 0 ? (
            <p className="text-sm text-gray-600">No matches recorded yet.</p>
          ) : (
            <ul className="divide-y text-sm text-gray-800">
              {mapEntries.map(([mapName, count]) => (
                <li key={mapName} className="flex items-center justify-between py-2">
                  <span className="font-medium">{mapName}</span>
                  <span className="text-gray-600">{count} match{count === 1 ? '' : 'es'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
          <h2 className="text-lg font-medium text-gray-900">Side Win Rate</h2>
          <p className="text-sm text-gray-700">Attack: {overview.attackWinRate * 100}%</p>
          <p className="text-sm text-gray-700">Defense: {overview.defenseWinRate * 100}%</p>
        </div>
      </section>

      <section className="border rounded-lg bg-white shadow-sm">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-medium text-gray-900">Matches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Map</th>
                <th className="py-3 px-4 font-semibold">Opponent</th>
                <th className="py-3 px-4 font-semibold">Event</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td className="py-4 px-4 text-gray-600" colSpan={4}>
                    No matches found.
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={String(match._id)} className="border-t">
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{match.map}</td>
                    <td className="py-3 px-4 text-gray-700">{match.opponentName}</td>
                    <td className="py-3 px-4 text-gray-700">{match.eventName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}
