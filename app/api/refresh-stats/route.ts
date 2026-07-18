import { NextRequest, NextResponse } from 'next/server'
import { computeDashboardStatsForStorage } from '@/lib/analytics/computeDashboardStatsForStorage'
import { connectToDB } from '@/lib/db'
import { DEFAULT_TEAM } from '@/lib/focusTeam'
import { DashboardStats } from '@/models/DashboardStats'
import { Match, type MatchDocument } from '@/models/Match'

export const dynamic = 'force-dynamic'

async function refreshStats(req: NextRequest) {
  try {
    const startTime = Date.now()
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')?.trim() || DEFAULT_TEAM.teamId

    await connectToDB()

    const matches = await Match.find({
      'analytics.evidence_v1.derived.mapsStats': {
        $elemMatch: { teamId },
      },
    })
      .select('gridSeriesId opponentName analytics.evidence_v1')
      .lean() as unknown as MatchDocument[]

    const statsDoc = computeDashboardStatsForStorage(matches, teamId)
    const documentId = teamId === DEFAULT_TEAM.teamId
      ? 'cloud9'
      : `team:${encodeURIComponent(teamId)}`

    await DashboardStats.findOneAndUpdate(
      { _id: documentId },
      {
        $set: {
          ...statsDoc,
          teamId,
        },
      },
      { upsert: true, new: true }
    )

    const winRate = statsDoc.totalSeries > 0
      ? (statsDoc.seriesWins / statsDoc.totalSeries) * 100
      : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalSeries: statsDoc.totalSeries,
        seriesWins: statsDoc.seriesWins,
        seriesLosses: statsDoc.seriesLosses,
        winRate: `${winRate.toFixed(1)}%`,
        attackWinRate: `${(statsDoc.attackWinRate * 100).toFixed(1)}%`,
        defenseWinRate: `${(statsDoc.defenseWinRate * 100).toFixed(1)}%`,
        recentSeriesCount: statsDoc.recentSeries.length,
        strugglingAgainstCount: statsDoc.strugglingAgainst.length,
      },
      timing: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[REFRESH-STATS] Error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh dashboard stats' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return refreshStats(req)
}

export async function POST(req: NextRequest) {
  return refreshStats(req)
}
