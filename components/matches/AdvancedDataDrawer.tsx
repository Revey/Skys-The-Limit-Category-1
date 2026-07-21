'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface AdvancedDataDrawerProps {
  children: ReactNode
  defaultOpen?: boolean
}

export function AdvancedDataDrawer({
  children,
  defaultOpen = false,
}: AdvancedDataDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <section className="card overflow-hidden border border-gray-800 bg-gray-900/70 backdrop-blur-xl">
      <button
        type="button"
        aria-controls={contentId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-white/5"
      >
        <span>
          <span className="block text-xl font-semibold text-white">Advanced data</span>
          <span className="mt-1 block text-sm text-gray-400">
            Full stats, heatmaps, economy, player breakdowns
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div id={contentId} className="space-y-6 border-t border-gray-800 p-6">
          {children}
        </div>
      )}
    </section>
  )
}
