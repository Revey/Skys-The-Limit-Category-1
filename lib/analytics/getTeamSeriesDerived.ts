import { Match } from '@/models/Match'
import type { EvidenceDerived } from '@/lib/types/evidence'
import type { SeriesDerivedInput } from '@/lib/analytics/aggregateTeamTendencies'

export interface TeamSeriesDerived extends SeriesDerivedInput {
  gridSeriesId?: string
  date?: Date
  derived?: Partial<EvidenceDerived>
}

export async function getTeamSeriesDerived(teamId: string): Promise<TeamSeriesDerived[]> {
  const matches = await Match.find(
    { 'analytics.evidence_v1.derived.mapsStats.teamId': teamId },
    {
      map: 1,
      gridSeriesId: 1,
      date: 1,
      'analytics.evidence_v1.derived': 1,
    }
  ).lean()

  return matches.map(match => {
    const projected = match as unknown as {
      map?: string
      gridSeriesId?: string
      date?: Date
      analytics?: { evidence_v1?: { derived?: Partial<EvidenceDerived> } }
    }

    return {
      map: projected.map,
      gridSeriesId: projected.gridSeriesId,
      date: projected.date,
      derived: projected.analytics?.evidence_v1?.derived,
    }
  })
}
