'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DEFAULT_TEAM,
  getClientFocusTeam,
  setClientFocusTeam,
  type FocusTeam,
} from '@/lib/focusTeam'

interface TeamOption extends FocusTeam {
  matches: number
}

export function TeamSelector() {
  const router = useRouter()
  const [focusTeam, setFocusTeam] = useState<FocusTeam>(DEFAULT_TEAM)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setFocusTeam(getClientFocusTeam())

    async function loadTeams() {
      try {
        const response = await fetch('/api/teams')
        if (!response.ok) throw new Error('Failed to load teams')
        const data = (await response.json()) as TeamOption[]
        if (!cancelled) setTeams(data)
      } catch (error) {
        console.error('[TEAM-SELECTOR] Failed to load teams:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTeams()
    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => {
    if (teams.some((team) => team.teamId === focusTeam.teamId)) return teams
    return [{ ...focusTeam, matches: 0 }, ...teams]
  }, [focusTeam, teams])

  const handleChange = (teamId: string) => {
    const team = options.find((option) => option.teamId === teamId)
    if (!team) return

    const nextFocusTeam = { teamId: team.teamId, teamName: team.teamName }
    setFocusTeam(nextFocusTeam)
    setClientFocusTeam(nextFocusTeam)
    router.refresh()
    window.location.reload()
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-400">
      <span className="hidden xl:inline">Focus team</span>
      <select
        aria-label="Focus team"
        value={focusTeam.teamId}
        onChange={(event) => handleChange(event.target.value)}
        disabled={loading}
        className="max-w-44 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-medium text-white outline-none transition-colors hover:border-[#00aeef] focus:border-[#00aeef] disabled:cursor-wait disabled:opacity-60"
      >
        {options.map((team) => (
          <option key={`${team.teamId}-${team.teamName}`} value={team.teamId}>
            {team.teamName}
          </option>
        ))}
      </select>
    </label>
  )
}
