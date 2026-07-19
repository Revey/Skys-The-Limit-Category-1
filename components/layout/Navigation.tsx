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
    { href: '/review', label: 'Review' },
    { href: '/matches', label: 'Opponents' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-[#00aeef]/20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-3 py-2 md:px-6 md:py-4">
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-between md:gap-0">
          {/* Left - Nav Links */}
          <div className="order-2 min-w-0 flex-1 overflow-x-auto md:order-none md:flex-none md:overflow-visible">
            <div className="flex min-w-max items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    className={`px-3 py-2 text-sm rounded-lg transition-all font-medium md:px-6 md:text-base ${
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
          </div>

          {/* Center - Brand */}
          <Link href="/dashboard" className="group order-1 shrink-0 md:absolute md:left-1/2 md:order-none md:-translate-x-1/2">
            <span className="text-lg font-semibold tracking-wide text-white transition-colors group-hover:text-[#00aeef] md:text-xl">
              StratOS
            </span>
          </Link>

          {/* Right - Focus team */}
          <div className="order-3 flex w-full justify-end md:order-none md:w-auto">
            <TeamSelector />
          </div>
        </div>
      </div>
    </nav>
  )
}
