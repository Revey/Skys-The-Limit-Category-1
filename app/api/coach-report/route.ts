import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const analytics = await req.json().catch(() => null)
  if (!analytics) return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  const summary = 'Placeholder coaching report based on provided analytics. Actionable insights will appear here.'
  return NextResponse.json({ report: summary })
}
