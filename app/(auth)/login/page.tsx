'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, User, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Safety timeout to prevent stuck loading screen
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError('Login timeout. Please try again.')
      console.error('Login timeout after 10 seconds')
    }, 10000)

    try {
      console.log('Attempting login...')
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin', // Ensure cookies are included
      })

      console.log('Login response status:', res.status)

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        console.log('Login successful, cookie should be set')

        // Clear timeout since we got a response
        clearTimeout(timeoutId)

        // Verify the cookie was actually set
        console.log('Verifying cookie was set...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Check if cookie exists in document.cookie (httpOnly cookies won't show here)
        // The cookie is httpOnly so we can't verify it client-side, just proceed
        console.log('Cookie should be set (httpOnly, cannot verify client-side)')

        console.log('Redirecting to dashboard...')
        // Use replace to avoid back-button issues
        window.location.replace('/dashboard')
        // Note: loading state stays true during navigation - this is intentional
      } else {
        clearTimeout(timeoutId)
        const data = await res.json().catch(() => ({}))
        console.error('Login failed:', data)
        setError(data.message || 'Invalid credentials')
        setLoading(false)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* VCT Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/VCT2026.png"
          alt="VCT Background"
          fill
          className="object-cover opacity-5"
          priority
        />
      </div>

      {/* Full Page Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-20 h-20 border-4 border-[#00aeef]/30 border-t-[#00aeef] rounded-full animate-spin" />
              {/* Inner pulsing circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#00aeef]/20 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-medium">Signing in...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00aeef] rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite 2s' }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-[#00aeef]/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-12 relative mb-4">
              <Image
                src="/logos/Cloud9 Assets/Cloud9 Logo_Blue_800x800px.svg"
                alt="Cloud9 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Cloud9 <span className="text-[#00aeef]">StratOS</span>
            </h1>
            <p className="text-gray-400">Valorant Team Analytics</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00aeef] focus:outline-none transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00aeef] focus:outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
