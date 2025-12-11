import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'C9 StratOS',
  description: 'AI assistant coach for Valorant — C9 StratOS',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="border-b bg-white">
          <div className="container-base py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold">C9 StratOS</Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-700 hover:text-black">Dashboard</Link>
              <button className="text-sm text-gray-700 hover:text-black" disabled>Logout</button>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          <div className="container-base py-8">{children}</div>
        </main>
        <footer className="border-t">
          <div className="container-base py-4 text-sm text-gray-500">© {new Date().getFullYear()} C9 StratOS</div>
        </footer>
      </body>
    </html>
  )
}
