import { NextResponse } from 'next/server'
import { connectToDB } from '@/lib/db'
import { normalizeTeamName } from '@/lib/teamUtils'
import { Match } from '@/models/Match'

interface AggregatedTeam {
  _id: {
    teamId: string
    teamName: string
  }
  matches: number
}

export async function GET() {
  try {
    await connectToDB()

    const aggregatedTeams = await Match.aggregate<AggregatedTeam>([
      {
        $match: {
          'analytics.evidence_v1.derived.mapsStats': { $type: 'array' },
        },
      },
      {
        $unwind: '$analytics.evidence_v1.derived.mapsStats',
      },
      {
        $replaceWith: {
          matchId: '$_id',
          teamId: '$analytics.evidence_v1.derived.mapsStats.teamId',
          teamName: '$analytics.evidence_v1.derived.mapsStats.teamName',
        },
      },
      {
        $match: {
          teamId: { $type: 'string', $ne: '' },
          teamName: { $type: 'string', $ne: '' },
        },
      },
      {
        $group: {
          _id: { matchId: '$matchId', teamId: '$teamId' },
          teamName: { $first: '$teamName' },
        },
      },
      {
        $group: {
          _id: { teamId: '$_id.teamId', teamName: '$teamName' },
          matches: { $sum: 1 },
        },
      },
    ])

    const normalizedTeams = new Map<string, { teamId: string; teamName: string; matches: number }>()

    for (const team of aggregatedTeams) {
      const teamId = team._id.teamId.trim()
      const rawTeamName = team._id.teamName.trim()
      if (!teamId || !rawTeamName) continue
      const teamName = normalizeTeamName(rawTeamName)

      const key = `${teamId}\u0000${teamName}`
      const existing = normalizedTeams.get(key)
      if (existing) {
        existing.matches += team.matches
      } else {
        normalizedTeams.set(key, { teamId, teamName, matches: team.matches })
      }
    }

    const teams = Array.from(normalizedTeams.values()).sort(
      (a, b) => b.matches - a.matches || a.teamName.localeCompare(b.teamName)
    )

    return NextResponse.json(teams, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('[TEAMS] Failed to aggregate teams:', error)
    return NextResponse.json({ message: 'Failed to load teams' }, { status: 500 })
  }
}
