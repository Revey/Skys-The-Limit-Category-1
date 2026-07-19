import { cookies } from 'next/headers'
import { ReviewQueue } from '@/components/coaching/ReviewQueue'
import {
  computeReviewQueue,
  type ReviewEvidence,
  type ReviewSeriesInput,
} from '@/lib/analytics/computeReviewQueue'
import { connectToDB } from '@/lib/db'
import { getFocusTeam } from '@/lib/focusTeam'
import { normalizeTeamName } from '@/lib/teamUtils'
import { Match } from '@/models/Match'

export const dynamic = 'force-dynamic'

interface ProjectedReviewSeries {
  _id: unknown
  gridSeriesId?: string
  map?: string
  analytics?: {
    evidence_v1?: ReviewEvidence
  }
}

export default async function ReviewPage() {
  const focusTeam = getFocusTeam(await cookies())
  const focusTeamName = normalizeTeamName(focusTeam.teamName)
  await connectToDB()

  const matches = await Match.find(
    { 'analytics.evidence_v1.derived.mapsStats.teamId': focusTeam.teamId },
    {
      gridSeriesId: 1,
      map: 1,
      'analytics.evidence_v1.games': 1,
      'analytics.evidence_v1.rounds': 1,
      'analytics.evidence_v1.plants': 1,
      'analytics.evidence_v1.clutchSituations': 1,
      'analytics.evidence_v1.economyRounds': 1,
      'analytics.evidence_v1.derived.mapsStats': 1,
      'analytics.evidence_v1.derived.manAdvantageStats': 1,
      'analytics.evidence_v1.derived.criticalRounds': 1,
    }
  )
    .sort({ 'analytics.evidence_v1.rounds.firstBlood.timestamp': -1, _id: -1 })
    .limit(20)
    .lean() as unknown as ProjectedReviewSeries[]

  const seriesList: ReviewSeriesInput[] = matches.flatMap(match => {
    const evidence = match.analytics?.evidence_v1
    if (!evidence) return []

    return [{
      matchId: String(match._id),
      gridSeriesId: match.gridSeriesId || '',
      map: match.map,
      evidence,
    }]
  })
  const items = computeReviewQueue(seriesList, focusTeam.teamId)

  return (
    <main className="min-h-screen px-6 pb-12 pt-24">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white">
            Review <span className="text-[#00aeef]">Queue</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Ranked VOD-review rounds from {focusTeamName}&apos;s 20 most recent series.
          </p>
        </header>

        {seriesList.length === 0 ? (
          <div className="card p-10 text-center">
            <h2 className="text-xl font-semibold text-white">No series available</h2>
            <p className="mt-2 text-sm text-gray-400">
              No recent evidence was found for {focusTeamName}.
            </p>
          </div>
        ) : (
          <ReviewQueue items={items} />
        )}
      </div>
    </main>
  )
}
