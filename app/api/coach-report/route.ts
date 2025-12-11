import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'
import { buildCoachPrompt } from '@/lib/prompts/coachReportPrompt'
import { computeMatchAnalytics, type MatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'

type CoachReportRequestBody = {
  matchId?: string
  analytics?: MatchAnalytics
}

type MatchAnalyticsInput = MatchAnalytics | undefined

function isMatchAnalytics(payload: unknown): payload is MatchAnalytics {
  if (!payload || typeof payload !== 'object') return false
  const analytics = payload as Partial<MatchAnalytics>
  return (
    typeof analytics.win === 'boolean' &&
    typeof analytics.rounds === 'number' &&
    typeof analytics.attackWinRate === 'number' &&
    typeof analytics.defenseWinRate === 'number' &&
    Array.isArray(analytics.topPlayers) &&
    typeof analytics.notes === 'string'
  )
}

async function generateCoachReport(prompt: string, analytics: MatchAnalytics): Promise<string> {
  const focusPhase = analytics.attackWinRate >= analytics.defenseWinRate ? 'defense' : 'attack'
  const paceCallout = analytics.rounds > 20 ? 'Match went long; stamina and economy tracking were key.' : 'Match ended quickly; early momentum was decisive.'
  const tempoNote = analytics.win
    ? 'Build on what worked and solidify protocols.'
    : 'Address gaps quickly with targeted drills.'

  return [
    'Coach Report:',
    '',
    'Narrative:',
    `${paceCallout} ${tempoNote}`,
    '',
    'Tactical Priorities:',
    `1) Strengthen ${focusPhase} setups with clearer mid-round calls.`,
    '2) Refine site hit spacing and post-plant crossfires.',
    '',
    'Player Action Items:',
    '- Emphasize disciplined trading for top fraggers to sustain impact.',
    '- Review utility layering to reduce dry peeks and stabilize early rounds.',
    '',
    'Prompt Context:',
    prompt,
  ].join('\n')
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CoachReportRequestBody | null

    if (!body) {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 })
    }

    const { matchId, analytics: analyticsInput } = body
    let analytics: MatchAnalyticsInput

    if (matchId) {
      await connectToDB()
      const match = await Match.findById(matchId).lean()

      if (!match) {
        return NextResponse.json({ message: 'Match not found' }, { status: 404 })
      }

      analytics = computeMatchAnalytics(match as any)
    } else if (isMatchAnalytics(analyticsInput)) {
      analytics = analyticsInput
    } else {
      return NextResponse.json(
        { message: 'Provide either a valid matchId or analytics payload' },
        { status: 400 },
      )
    }

    const prompt = buildCoachPrompt(analytics)
    const report = await generateCoachReport(prompt, analytics)

    return NextResponse.json({ prompt, report })
  } catch (error) {
    console.error('Error generating coach report', error)
    return NextResponse.json({ message: 'Failed to generate coach report' }, { status: 500 })
  }
}
