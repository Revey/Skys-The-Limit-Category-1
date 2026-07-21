export type Stage = 'kickoff' | 'stage-1' | 'stage-2' | 'playoffs'

export type TournamentMeta = Readonly<{
  year: 2024 | 2025
  stage: Stage
  region: 'Americas'
  label: string
  month: string
  order: number
}>

type TournamentFilter = {
  year: 'all' | '2024' | '2025'
  stage: 'all' | Stage
}

const STAGE_LABELS: Record<Stage, string> = {
  kickoff: 'Kickoff',
  'stage-1': 'Stage 1',
  'stage-2': 'Stage 2',
  playoffs: 'Playoffs',
}

function tournament(
  year: TournamentMeta['year'],
  stage: Stage,
  month: string,
  order: number
): TournamentMeta {
  return {
    year,
    stage,
    region: 'Americas',
    label: `VCT ${year} Americas ${STAGE_LABELS[stage]}`,
    month,
    order,
  }
}

export const TOURNAMENTS: Record<string, TournamentMeta> = {
  '757073': tournament(2024, 'kickoff', 'Feb 2024', 1),
  '757074': tournament(2024, 'kickoff', 'Feb 2024', 1),
  '757628': tournament(2024, 'kickoff', 'Feb 2024', 1),
  '757629': tournament(2024, 'kickoff', 'Feb 2024', 1),
  '757101': tournament(2024, 'stage-1', 'Apr 2024', 2),
  '757234': tournament(2024, 'stage-1', 'Apr 2024', 2),
  '757235': tournament(2024, 'stage-1', 'Apr 2024', 2),
  '757321': tournament(2024, 'stage-1', 'Apr 2024', 2),
  '758114': tournament(2024, 'stage-2', 'Jun 2024', 3),
  '774784': tournament(2024, 'playoffs', 'Aug 2024', 4),
  '774785': tournament(2024, 'playoffs', 'Aug 2024', 4),
  '774787': tournament(2024, 'playoffs', 'Aug 2024', 4),
  '775518': tournament(2025, 'kickoff', 'Feb 2025', 5),
  '800677': tournament(2025, 'stage-1', 'Sep 2025', 6),
  '800678': tournament(2025, 'stage-1', 'Sep 2025', 6),
  '800680': tournament(2025, 'stage-1', 'Sep 2025', 6),
  '826662': tournament(2025, 'stage-2', 'Nov 2025', 7),
  '826663': tournament(2025, 'stage-2', 'Nov 2025', 7),
  '826992': tournament(2025, 'stage-2', 'Nov 2025', 7),
}

export function getTournamentMeta(tournamentId?: string): TournamentMeta | null {
  return tournamentId ? TOURNAMENTS[tournamentId] ?? null : null
}

export function tournamentLabel(tournamentId?: string): string {
  return getTournamentMeta(tournamentId)?.label ?? 'VCT Americas'
}

export function stageLabel(stage: Stage): string {
  return STAGE_LABELS[stage]
}

export function matchesVctFilter(
  tournamentId: string | undefined,
  filter: TournamentFilter
): boolean {
  if (filter.year === 'all' && filter.stage === 'all') return true

  const meta = getTournamentMeta(tournamentId)
  if (!meta) return false

  const matchesYear = filter.year === 'all' || String(meta.year) === filter.year
  const matchesStage = filter.stage === 'all' || meta.stage === filter.stage
  return matchesYear && matchesStage
}
