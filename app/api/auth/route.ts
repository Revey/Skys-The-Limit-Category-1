import { NextResponse } from 'next/server'
import { AUTH_CONFIG } from '@/config/auth'

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}))
  if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set(AUTH_CONFIG.cookieName, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Session cookie for now
    })
    return res
  }
  return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
}
