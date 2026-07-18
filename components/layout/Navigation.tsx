'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TeamSelector } from './TeamSelector'

export function Navigation() {
  const pathname = usePathname()
  
  // Don't show nav on root page
  if (pathname === '/') return null

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/matches', label: 'Opponents' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-[#00aeef]/20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`px-6 py-2 rounded-lg transition-all font-medium ${
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                      ? 'bg-[#00aeef] text-white shadow-lg shadow-[#00aeef]/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Center - Brand */}
          <Link href="/dashboard" className="group absolute left-1/2 -translate-x-1/2">
            <span className="text-xl font-semibold tracking-wide text-white transition-colors group-hover:text-[#00aeef]">
              StratOS
            </span>
          </Link>

          {/* Right - Focus team */}
          <TeamSelector />
        </div>
      </div>
    </nav>
  )
}
