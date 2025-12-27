import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/layout/Navigation'

export const metadata = {
  title: 'C9 StratOS',
  description: 'AI assistant coach for Valorant — C9 StratOS',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-gray-800 bg-black/50 backdrop-blur">
          <div className="container-base py-4 text-sm text-gray-500">
            © {new Date().getFullYear()} Cloud9 StratOS — AI-Powered Valorant Analytics
          </div>
        </footer>
      </body>
    </html>
  )
}
