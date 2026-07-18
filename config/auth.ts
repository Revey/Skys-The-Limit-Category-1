export const AUTH_CONFIG = {
  // Credentials come from env — never hardcode them here (this file is committed).
  username: process.env.AUTH_USERNAME ?? '',
  password: process.env.AUTH_PASSWORD ?? '',
  cookieName: 'c9_auth',
}

export function isAuthenticatedCookie(value: string | undefined): boolean {
  return value === '1'
}
