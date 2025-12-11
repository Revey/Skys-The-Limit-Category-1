import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'
import { computeMatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'

type Context = { params: { matchId: string } }

export async function GET(_req: Request, ctx: Context) {
  await connectToDB()
  const match = await Match.findById(ctx.params.matchId).lean()
  if (!match) {
    return NextResponse.json({ message: 'Match not found' }, { status: 404 })
  }
  const analytics = computeMatchAnalytics(match as any)
  return NextResponse.json(analytics)
}
