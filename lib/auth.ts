import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_CONFIG, isAuthenticatedCookie } from '@/config/auth'

export function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const value = cookieStore.get(AUTH_CONFIG.cookieName)?.value
  return isAuthenticatedCookie(value)
}

export function requireAuth() {
  if (!isAuthenticated()) {
    redirect('/login')
  }
}
