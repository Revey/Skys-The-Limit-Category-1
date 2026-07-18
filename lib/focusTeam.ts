export const FOCUS_TEAM_COOKIE = 'stratos_team'

export interface FocusTeam {
  teamId: string
  teamName: string
}

export const DEFAULT_TEAM: FocusTeam = {
  teamId: '79',
  teamName: 'Cloud9',
}

interface CookieReader {
  get(name: string): { value: string } | undefined
}

function parseFocusTeam(value: string | undefined): FocusTeam | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<FocusTeam>
    const teamId = typeof parsed.teamId === 'string' ? parsed.teamId.trim() : ''
    const teamName = typeof parsed.teamName === 'string' ? parsed.teamName.trim() : ''

    if (!teamId || !teamName) return null
    return { teamId, teamName }
  } catch {
    return null
  }
}

export function getFocusTeam(cookieStore: CookieReader): FocusTeam {
  return parseFocusTeam(cookieStore.get(FOCUS_TEAM_COOKIE)?.value) ?? DEFAULT_TEAM
}

export function getClientFocusTeam(): FocusTeam {
  if (typeof document === 'undefined') return DEFAULT_TEAM

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${FOCUS_TEAM_COOKIE}=`))

  return parseFocusTeam(cookie?.slice(FOCUS_TEAM_COOKIE.length + 1)) ?? DEFAULT_TEAM
}

export function useFocusTeam(): FocusTeam {
  return getClientFocusTeam()
}

export function setClientFocusTeam(team: FocusTeam): void {
  const value = encodeURIComponent(JSON.stringify(team))
  document.cookie = `${FOCUS_TEAM_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`
}
