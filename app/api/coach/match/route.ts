import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'
import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { generateCoachingReport } from '@/lib/ai/coach'

export async function POST(req: NextRequest) {
  await requireAuth()
  await connectToDB()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const matchId = (body as Record<string, unknown>)?.matchId as string | undefined
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
  }

  const match = await Match.findById(matchId).lean()
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  let analytics
  try {
    analytics = computeMatchAnalytics(match)
  } catch (err) {
    console.error('Failed to compute analytics for match', matchId, err)
    return NextResponse.json(
      { error: 'Failed to compute analytics' },
      { status: 500 }
    )
  }

  try {
    const report = await generateCoachingReport(analytics)
    return NextResponse.json({ report })
  } catch (err) {
    console.error('Failed to generate coaching report', err)
    return NextResponse.json(
      { error: 'Failed to generate coaching report' },
      { status: 500 }
    )
  }
}
