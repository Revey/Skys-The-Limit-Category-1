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

          {/* Center - Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group absolute left-1/2 transform -translate-x-1/2">
            <div className="w-10 h-10 flex items-center justify-center transition-all overflow-hidden">
              {!logoError ? (
                <Image
                  src="/logos/Cloud9 Assets/Cloud9 Logo_Blue_800x800px.svg"
                  alt="Cloud9"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                  unoptimized
                />
              ) : (
                <span className="text-xl font-bold text-[#00aeef]">C9</span>
              )}
            </div>
            <span className="text-xl font-medium text-white">
              Cloud9 <span className="text-[#00aeef]">StratOS</span>
            </span>
          </Link>

          {/* Right - Empty Spacer to maintain layout balance */}
          <div className="w-[100px]"></div>
        </div>
      </div>
    </nav>
  )
}
