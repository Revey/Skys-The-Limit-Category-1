import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { Team } from '@/models/Team'
import { computeTeamOverview, type TeamOverviewStats } from '@/lib/analytics/computeTeamOverview'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  requireAuth()
  await connectToDB()

  // For simplicity, pick or create a primary team named "Cloud9"
  const team = (await Team.findOne({ name: 'Cloud9' })) || (await Team.create({ name: 'Cloud9', region: 'Americas' }))
  const matches = (await Match.find({ team: team._id }).sort({ date: -1 }).lean()) as unknown as MatchDocument[]
  const overview: TeamOverviewStats = computeTeamOverview(matches)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Team Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard title="Matches" value={overview.totalMatches} />
        <SummaryCard title="Wins" value={overview.wins} />
        <SummaryCard title="Losses" value={overview.losses} />
      </div>

      <section>
        <h2 className="text-lg font-medium mb-2">Recent Matches</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Map</th>
                <th className="py-2 pr-4">Opponent</th>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={String(m._id)} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">{new Date(m.date).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{m.map}</td>
                  <td className="py-2 pr-4">{m.opponentName}</td>
                  <td className="py-2 pr-4">{m.eventName}</td>
                  <td className="py-2 pr-4">
                    <Link className="text-blue-600 hover:underline" href={`/matches/${m._id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Attack vs Defense Win Rate</h3>
          <p className="text-sm text-gray-700">Attack: {overview.attackWinRate}% — Defense: {overview.defenseWinRate}%</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Map Pool Performance</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            {overview.mapsPlayed.map((m) => (
              <li key={m.map}>
                {m.map}: {m.count}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
