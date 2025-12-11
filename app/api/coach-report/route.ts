import { NextRequest, NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'
import { computeMatchAnalytics, type MatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import { buildCoachPrompt } from '@/lib/ai/coachPrompt'
import { generateCoachReport } from '@/lib/ai/llmClient'

type RequestBody = {
  matchId?: string
  analytics?: MatchAnalytics
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody
    let analytics: MatchAnalytics

    if (body.matchId) {
      await connectToDB()
      const match = await Match.findById(body.matchId).lean()

      if (!match) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 })
      }

      analytics = computeMatchAnalytics(match as any)
    } else if (body.analytics) {
      analytics = body.analytics
    } else {
      return NextResponse.json(
        { error: 'Provide either matchId or analytics' },
        { status: 400 }
      )
    }

    const prompt = buildCoachPrompt(analytics)
    const report = await generateCoachReport(prompt)

    return NextResponse.json({ prompt, report })
  } catch (error) {
    console.error('Error generating coach report:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate coach report'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
