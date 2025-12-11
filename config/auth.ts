export const AUTH_CONFIG = {
  username: 'Cloud9',
  password: '<redacted>',
  cookieName: 'c9_auth',
}

export function isAuthenticatedCookie(value: string | undefined): boolean {
  return value === '1'
}
