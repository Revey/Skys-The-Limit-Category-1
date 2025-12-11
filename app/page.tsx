import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'

export default function LandingPage() {
  const authenticated = isAuthenticated()
  const primaryCta = authenticated
    ? { href: '/dashboard', label: 'Go to dashboard' }
    : { href: '/login', label: 'Log in to StratOS' }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Cloud9 Valorant</p>
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">C9 StratOS</h1>
        <p className="text-lg text-gray-700">
          StratOS is an AI assistant coach for Valorant—built to help Cloud9 analyze matches, surface insights,
          and prepare winning game plans.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={primaryCta.href}
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900"
        >
          {primaryCta.label}
        </Link>
        <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-black">
          View the dashboard overview
        </Link>
      </div>
    </div>
  )
}
