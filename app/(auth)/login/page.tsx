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

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        // Use window.location for hard navigation to ensure cookies are picked up
        window.location.href = '/dashboard'
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Invalid credentials')
        setLoading(false)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Full Page Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              {/* Inner pulsing circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-pulse" />
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
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"
          style={{ animation: 'pulse 4s ease-in-out infinite 2s' }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 relative mb-4">
              <Image
                src="/logos/C9.png"
                alt="Cloud9 Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Cloud9 <span className="text-blue-400">StratOS</span>
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
                  className="w-full bg-black/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all"
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
                  className="w-full bg-black/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all"
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

          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-center text-blue-400 text-sm font-medium mb-2">Demo Credentials</p>
            <div className="text-center text-gray-400 text-sm space-y-1">
              <p>Username: <code className="text-blue-300 bg-black/30 px-2 py-0.5 rounded">Cloud9</code></p>
              <p>Password: <code className="text-blue-300 bg-black/30 px-2 py-0.5 rounded"><redacted></code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
