'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [logoError, setLogoError] = useState(false)
  
  // Don't show nav on login page or landing page
  if (pathname === '/login' || pathname === '/') return null

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/matches', label: 'Matches' },
  ]

  const handleLogout = async () => {
    document.cookie = 'c9_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-blue-500/20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`px-6 py-2 rounded-lg transition-all font-medium ${
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Center - Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group absolute left-1/2 transform -translate-x-1/2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all overflow-hidden">
              {!logoError ? (
                <Image
                  src="/logos/C9.png"
                  alt="Cloud9"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain p-1"
                  onError={() => setLogoError(true)}
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold text-white">C9</span>
              )}
            </div>
            <span className="text-xl font-medium text-white">
              Cloud9 <span className="text-blue-400">StratOS</span>
            </span>
          </Link>

          {/* Right - Logout */}
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
