import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectToDB } from '@/lib/db'
import { Match, type MatchDocument } from '@/models/Match'
import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { generateCoachingReport } from '@/lib/ai/coach'

/**
 * GET /api/coach/match
 * Fetch match data with evidence_v1
 * Query params: matchId or seriesId
 */
export async function GET(req: NextRequest) {
  await requireAuth()
  await connectToDB()

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const seriesId = searchParams.get('seriesId')

  if (!matchId && !seriesId) {
    return NextResponse.json(
      { error: 'Either matchId or seriesId is required' },
      { status: 400 }
    )
  }

  let match: MatchDocument | null = null

  try {
    if (matchId) {
      match = (await Match.findById(matchId).lean()) as MatchDocument | null
    } else if (seriesId) {
      match = (await Match.findOne({ gridSeriesId: seriesId }).lean()) as MatchDocument | null
    }

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Build response with evidence
    const response = {
      matchId: match._id.toString(),
      meta: {
        seriesId: match.gridSeriesId || '',
        tournamentId: match.tournamentId || '',
        map: match.map,
        opponentName: match.opponentName,
        eventName: match.eventName,
        date: match.date,
        games: match.analytics?.evidence_v1?.games || [],
      },
      evidence: match.analytics?.evidence_v1 || null,
      evidenceMeta: match.analytics?.evidence_v1_meta || null,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Failed to fetch match', err)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/coach/match
 * Generate coaching report for a match
 * Body: { matchId: string }
 */
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

  const match = (await Match.findById(matchId).lean()) as MatchDocument | null
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
    // Pass evidence_v1 if available
    const evidence = match.analytics?.evidence_v1 || null
    const report = await generateCoachingReport(analytics, evidence)
    return NextResponse.json({ report })
  } catch (err) {
    console.error('Failed to generate coaching report', err)
    return NextResponse.json(
      { error: 'Failed to generate coaching report' },
      { status: 500 }
    )
  }
}
