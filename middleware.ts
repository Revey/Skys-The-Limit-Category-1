import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_CONFIG } from '@/config/auth'

// Define which paths require authentication
const protectedPaths = ['/dashboard', '/matches']

// Define public paths that should redirect to dashboard if authenticated
const publicPaths = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get(AUTH_CONFIG.cookieName)
  const isAuthenticated = authCookie?.value === '1'

  console.log('[MIDDLEWARE] Path:', pathname)
  console.log('[MIDDLEWARE] Looking for cookie:', AUTH_CONFIG.cookieName)
  console.log('[MIDDLEWARE] Cookie found:', authCookie ? 'YES' : 'NO')
  console.log('[MIDDLEWARE] Cookie value:', authCookie?.value)
  console.log('[MIDDLEWARE] Is authenticated:', isAuthenticated)
  console.log('[MIDDLEWARE] All cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value}`).join(', '))

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Redirect to login if accessing protected path without auth
  if (isProtectedPath && !isAuthenticated) {
    console.log('[MIDDLEWARE] Protected path without auth, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing login while already authenticated
  if (isPublicPath && isAuthenticated) {
    console.log('[MIDDLEWARE] Already authenticated, redirecting to dashboard')
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // For root path, redirect based on auth status
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log('[MIDDLEWARE] Root path with auth, redirecting to dashboard')
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    } else {
      console.log('[MIDDLEWARE] Root path without auth, allowing landing page')
      // Allow landing page to render
    }
  }

  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
