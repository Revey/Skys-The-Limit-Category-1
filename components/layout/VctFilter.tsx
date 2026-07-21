'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_VCT_FILTER,
  getClientVctFilter,
  setClientVctFilter,
  type VctFilter as VctFilterValue,
} from '@/lib/vctFilter'

const YEAR_OPTIONS: Array<{ value: VctFilterValue['year']; label: string }> = [
  { value: 'all', label: 'All' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
]

const STAGE_OPTIONS: Array<{ value: VctFilterValue['stage']; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'kickoff', label: 'Kickoff' },
  { value: 'stage-1', label: 'Stage 1' },
  { value: 'stage-2', label: 'Stage 2' },
  { value: 'playoffs', label: 'Playoffs' },
]

export function VctFilter() {
  const router = useRouter()
  const [filter, setFilter] = useState<VctFilterValue>(DEFAULT_VCT_FILTER)

  useEffect(() => {
    setFilter(getClientVctFilter())
  }, [])

  const handleChange = (nextFilter: VctFilterValue) => {
    setFilter(nextFilter)
    setClientVctFilter(nextFilter)
    router.refresh()
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none" aria-label="VCT filter">
      <div className="flex shrink-0 rounded-lg border border-gray-700 bg-gray-900 p-0.5">
        {YEAR_OPTIONS.map((option) => {
          const active = filter.year === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => handleChange({ ...filter, year: option.value })}
              className={`rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#00aeef]/20 text-white ring-1 ring-inset ring-[#00aeef]/60'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto md:max-w-[21rem]">
        <div className="flex min-w-max items-center gap-1">
          {STAGE_OPTIONS.map((option) => {
            const active = filter.stage === option.value

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => handleChange({ ...filter, stage: option.value })}
                className={`whitespace-nowrap rounded-full border px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#00aeef]/60 bg-[#00aeef]/15 text-[#8adfff]'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-[#00aeef]/40 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
