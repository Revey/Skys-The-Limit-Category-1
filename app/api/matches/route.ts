import { NextResponse } from 'next/server'

import { connectToDB } from '@/lib/db'
import { Match } from '@/models/Match'

export async function GET() {
  try {
    await connectToDB()
    // Exclude heavy payloads (rawData, analytics) — the list view only needs summary
    // fields, and full docs exceed MongoDB's 32MB in-memory sort limit on M0.
    const matches = await Match.find({}, { rawData: 0, analytics: 0 })
      .sort({ date: -1 })
      .lean()
    return NextResponse.json(matches, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch matches', error)
    return NextResponse.json({ message: 'Failed to fetch matches' }, { status: 500 })
  }
}
