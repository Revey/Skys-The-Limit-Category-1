import { NextRequest, NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'
import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'
import {
  buildCoachPrompt,
  generateCoachingReport,
  type MatchAnalytics,
} from '@/lib/ai/coach'

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

      const fullAnalytics = computeMatchAnalytics(match as any)
      // Convert to coach.ts MatchAnalytics format (without assists/agent)
      analytics = {
        teamName: fullAnalytics.teamName,
        opponentName: fullAnalytics.opponentName,
        map: fullAnalytics.map,
        eventName: fullAnalytics.eventName,
        date: fullAnalytics.date,
        roundsPlayed: fullAnalytics.roundsPlayed,
        teamRoundsWon: fullAnalytics.teamRoundsWon,
        teamRoundsLost: fullAnalytics.teamRoundsLost,
        players: fullAnalytics.players.map((p) => ({
          name: p.name,
          kills: p.kills,
          deaths: p.deaths,
          kd: p.kd,
        })),
      }
    } else if (body.analytics) {
      analytics = body.analytics
    } else {
      return NextResponse.json(
        { error: 'Provide either matchId or analytics' },
        { status: 400 }
      )
    }

    const prompt = buildCoachPrompt(analytics)
    const report = await generateCoachingReport(analytics)

    return NextResponse.json({ prompt, report })
  } catch (error) {
    console.error('Error generating coach report:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate coach report'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
