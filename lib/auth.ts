import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_CONFIG, isAuthenticatedCookie } from '@/config/auth'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(AUTH_CONFIG.cookieName)?.value
  return isAuthenticatedCookie(value)
}

export async function requireAuth(): Promise<void> {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }
}
