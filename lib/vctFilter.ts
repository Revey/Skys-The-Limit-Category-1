import { TOURNAMENTS, type Stage } from '@/lib/tournaments'

export const VCT_FILTER_COOKIE = 'stratos_vct'

export type VctFilter = {
  year: 'all' | '2024' | '2025'
  stage: 'all' | Stage
}

export const DEFAULT_VCT_FILTER: VctFilter = {
  year: 'all',
  stage: 'all',
}

interface CookieReader {
  get(name: string): { value: string } | undefined
}

function parseVctFilter(value: string | undefined): VctFilter | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<VctFilter>
    const validYears: VctFilter['year'][] = ['all', '2024', '2025']
    const validStages: VctFilter['stage'][] = ['all', 'kickoff', 'stage-1', 'stage-2', 'playoffs']

    if (!parsed.year || !validYears.includes(parsed.year)) return null
    if (!parsed.stage || !validStages.includes(parsed.stage)) return null
    return { year: parsed.year, stage: parsed.stage }
  } catch {
    return null
  }
}

export function getVctFilter(cookieStore: CookieReader): VctFilter {
  return parseVctFilter(cookieStore.get(VCT_FILTER_COOKIE)?.value) ?? DEFAULT_VCT_FILTER
}

export function getClientVctFilter(): VctFilter {
  if (typeof document === 'undefined') return DEFAULT_VCT_FILTER

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${VCT_FILTER_COOKIE}=`))

  return parseVctFilter(cookie?.slice(VCT_FILTER_COOKIE.length + 1)) ?? DEFAULT_VCT_FILTER
}

export function setClientVctFilter(filter: VctFilter): void {
  const value = encodeURIComponent(JSON.stringify(filter))
  document.cookie = `${VCT_FILTER_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function tournamentIdsFor(filter: VctFilter): string[] | null {
  if (filter.year === 'all' && filter.stage === 'all') return null

  return Object.entries(TOURNAMENTS)
    .filter(([, meta]) => {
      const matchesYear = filter.year === 'all' || String(meta.year) === filter.year
      const matchesStage = filter.stage === 'all' || meta.stage === filter.stage
      return matchesYear && matchesStage
    })
    .map(([tournamentId]) => tournamentId)
}
