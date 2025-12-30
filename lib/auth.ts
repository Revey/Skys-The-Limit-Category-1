import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_CONFIG, isAuthenticatedCookie } from '@/config/auth'

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(AUTH_CONFIG.cookieName)?.value
    const isAuth = isAuthenticatedCookie(value)
    console.log('[AUTH] Auth check - Cookie value:', value, 'IsAuth:', isAuth)
    return isAuth
  } catch (error) {
    console.error('[AUTH] Error checking authentication:', error)
    return false
  }
}

export async function requireAuth(): Promise<void> {
  console.log('[AUTH] requireAuth() called')
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    console.log('[AUTH] Not authenticated, redirecting to login')
    redirect('/login')
  }
  console.log('[AUTH] Authentication verified')
}
