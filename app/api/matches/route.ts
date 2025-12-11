import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'
import { Team } from '@/models/Team'

export async function GET() {
  await connectToDB()
  const matches = await Match.find({}).sort({ date: -1 }).lean()
  return NextResponse.json(matches)
}

export async function POST(req: Request) {
  await connectToDB()
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })

  const {
    gridMatchId,
    teamId,
    teamName,
    opponentName,
    map,
    eventName,
    date,
    rawData = null,
  } = body

  if (!gridMatchId || !opponentName || !map || !eventName || !date) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
  }

  let teamRef
  if (teamId) {
    teamRef = teamId
  } else {
    const name = teamName || 'Cloud9'
    const team = (await Team.findOne({ name })) || (await Team.create({ name, region: 'Americas' }))
    teamRef = team._id
  }

  try {
    const created = await Match.create({
      gridMatchId,
      team: teamRef,
      opponentName,
      map,
      eventName,
      date,
      rawData,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ message: 'Duplicate gridMatchId' }, { status: 409 })
    }
    return NextResponse.json({ message: 'Failed to create match' }, { status: 500 })
  }
}
