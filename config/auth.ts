export const AUTH_CONFIG = {
  username: 'coach',
  password: 'stratos',
  cookieName: 'c9_auth',
}

export function isAuthenticatedCookie(value: string | undefined): boolean {
  return value === '1'
}
