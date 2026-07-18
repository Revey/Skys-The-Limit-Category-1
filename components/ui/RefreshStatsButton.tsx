'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface RefreshStatsButtonProps {
  teamId: string
}

export function RefreshStatsButton({ teamId }: RefreshStatsButtonProps) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStats = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/refresh-stats?teamId=${encodeURIComponent(teamId)}`,
        { cache: 'no-store' }
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh stats')
      }
      router.refresh()
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh stats')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={refreshStats}
        disabled={refreshing}
        className="btn-primary inline-flex items-center gap-2 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing stats...' : 'Refresh stats'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
