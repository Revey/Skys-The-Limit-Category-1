import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
  await requireAuth()
  await connectToDB()

  const matches = (await Match.find().sort({ date: -1 }).lean()) as unknown as MatchDocument[]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Matches</h1>
        <p className="text-sm text-gray-600 mt-1">View all recorded matches.</p>
      </header>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Map</th>
                <th className="py-3 px-4 font-semibold">Opponent</th>
                <th className="py-3 px-4 font-semibold">Event</th>
                <th className="py-3 px-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td className="py-4 px-4 text-gray-600" colSpan={5}>
                    No matches found.
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={String(match._id)} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{match.map}</td>
                    <td className="py-3 px-4 text-gray-700">{match.opponentName}</td>
                    <td className="py-3 px-4 text-gray-700">{match.eventName}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/matches/${match._id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
