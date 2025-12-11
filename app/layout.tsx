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
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="container-base py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              C9 StratOS
            </Link>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Link href="/dashboard" className="hover:text-black">
                Dashboard
              </Link>
              <Link href="/matches" className="hover:text-black">
                Matches
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 font-medium hover:border-gray-400 hover:text-black"
              >
                Logout
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="container-base py-12">{children}</div>
        </main>
        <footer className="border-t bg-white/80">
          <div className="container-base py-4 text-sm text-gray-500">© {new Date().getFullYear()} C9 StratOS</div>
        </footer>
      </body>
    </html>
  )
}
