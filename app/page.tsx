import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

export default async function LandingPage() {
  const authenticated = await isAuthenticated()
  const primaryCta = authenticated
    ? { href: '/dashboard', label: 'Go to Dashboard' }
    : { href: '/login', label: 'Log in to StratOS' }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto px-6 animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
            <span className="text-5xl font-bold text-white">C9</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-xs uppercase tracking-[0.3em] text-blue-400 mb-4">Cloud9 Valorant</p>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Cloud9 <span className="text-gradient-blue">StratOS</span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          AI-powered coaching assistant for Valorant — analyze matches, surface tactical insights,
          and prepare winning strategies with advanced analytics.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={primaryCta.href} className="btn-primary text-lg px-8 py-4">
            {primaryCta.label}
          </Link>
          <Link 
            href="/dashboard" 
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            View team overview
            <span className="text-blue-400">→</span>
          </Link>
        </div>

        {/* Stats Preview */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto opacity-60">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">212</div>
            <div className="text-sm text-gray-500">Matches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">7.2K</div>
            <div className="text-sm text-gray-500">Events</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">12</div>
            <div className="text-sm text-gray-500">Maps</div>
          </div>
        </div>
      </div>
    </div>
  )
}
