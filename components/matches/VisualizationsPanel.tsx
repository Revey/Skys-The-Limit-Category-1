'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EconomyTimeline from '@/components/visualizations/EconomyTimeline'
import HighlightReel from '@/components/visualizations/HighlightReel'
import KillHeatmap from '@/components/visualizations/KillHeatmap'
import PlayerComparisonCard from '@/components/visualizations/PlayerComparisonCard'
import RoundTimeline from '@/components/visualizations/RoundTimeline'
import WinProbabilityTimeline from '@/components/visualizations/WinProbabilityTimeline'
import { computeHighlights } from '@/lib/analytics/computeHighlights'
import { computePlayerCards } from '@/lib/analytics/computePlayerCards'
import { normalizeTeamName } from '@/lib/teamUtils'
import type { EvidenceV1 } from '@/lib/types/evidence'

interface VisualizationsPanelProps {
  matchId: string
  selectedGameId?: string
  teamId: string
  teamName: string
}

export function VisualizationsPanel({
  matchId,
  selectedGameId,
  teamId,
  teamName,
}: VisualizationsPanelProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<EvidenceV1 | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function fetchEvidence() {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/coach/match?matchId=${matchId}&teamId=${encodeURIComponent(teamId)}`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch evidence')
        }

        const data = await response.json()
        setEvidence(data.evidence as EvidenceV1)
        setError(null)
      } catch (fetchError) {
        console.error('Error fetching evidence:', fetchError)
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load visualizations')
      } finally {
        setLoading(false)
      }
    }

    fetchEvidence()
  }, [matchId, teamId])

  const teamNames = useMemo(() => {
    if (!evidence) return { team: teamName, opponent: 'Opponent', opponentId: '' }

    const names: Record<string, string> = { [teamId]: teamName }
    const addTeamName = (candidateTeamId?: string, candidateTeamName?: string) => {
      if (candidateTeamId && candidateTeamName) {
        names[candidateTeamId] = normalizeTeamName(candidateTeamName)
      }
    }

    evidence.derived?.firstBloodStats?.forEach(stat => addTeamName(stat.teamId, stat.teamName))
    evidence.derived?.mapsStats?.forEach(stat => addTeamName(stat.teamId, stat.teamName))
    evidence.economyRounds?.forEach(round => addTeamName(round.teamId, round.teamName))

    const opponentId = Object.keys(names).find(id => id !== teamId) || ''
    return {
      team: names[teamId] || teamName,
      opponent: opponentId ? names[opponentId] : 'Opponent',
      opponentId,
    }
  }, [evidence, teamId, teamName])

  const filteredData = useMemo(() => {
    if (!evidence) return { rounds: [], kills: [], economy: [], games: [] }

    const games = [...(evidence.games || [])]
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .filter(game => !selectedGameId || game.gameId === selectedGameId)
    const gameOrder = new Map(games.map((game, index) => [game.gameId, index]))
    const rounds = (evidence.rounds || [])
      .filter(round => !selectedGameId || round.gameId === selectedGameId)
      .sort((a, b) => {
        const gameDelta =
          (gameOrder.get(a.gameId) ?? Number.MAX_SAFE_INTEGER) -
          (gameOrder.get(b.gameId) ?? Number.MAX_SAFE_INTEGER)
        return gameDelta || a.roundNumber - b.roundNumber
      })
    const kills = (evidence.kills || []).filter(
      kill => !selectedGameId || kill.gameId === selectedGameId
    )
    const economy = (evidence.economyRounds || []).filter(
      round => !selectedGameId || round.gameId === selectedGameId
    )

    return { rounds, kills, economy, games }
  }, [evidence, selectedGameId])

  const highlights = useMemo(
    () => evidence ? computeHighlights(evidence, teamId) : [],
    [evidence, teamId]
  )
  const filteredHighlights = useMemo(
    () => highlights.filter(highlight => !selectedGameId || highlight.gameId === selectedGameId),
    [highlights, selectedGameId]
  )
  const playerCards = useMemo(
    () => evidence ? computePlayerCards(evidence, { focusTeamId: teamId, selectedGameId }) : [],
    [evidence, teamId, selectedGameId]
  )

  const roundTimelineData = useMemo(() => {
    let scoreGameId = ''
    let teamScore = 0
    let opponentScore = 0

    return filteredData.rounds.map(round => {
      if (round.gameId !== scoreGameId) {
        scoreGameId = round.gameId
        teamScore = 0
        opponentScore = 0
      }

      const won = round.winnerTeamId === teamId
      if (won) teamScore++
      else opponentScore++

      const game = filteredData.games.find(candidate => candidate.gameId === round.gameId)
      const economy = filteredData.economy.find(
        entry =>
          entry.roundNumber === round.roundNumber &&
          entry.gameId === round.gameId &&
          entry.teamId === teamId
      )
      const roundHighlights = filteredHighlights.filter(
        highlight =>
          highlight.roundNumber === round.roundNumber &&
          highlight.gameId === round.gameId
      )

      return {
        roundNumber: round.roundNumber,
        gameId: round.gameId,
        mapName: game?.mapName || 'Unknown',
        won,
        winType: round.winType || 'unknown',
        events: [],
        score: { team: teamScore, opponent: opponentScore },
        economyTier: economy?.economyTier || 'unknown',
        isHighlight: roundHighlights.length > 0,
        highlightTypes: roundHighlights.map(highlight => highlight.type.replace('_', ' ')),
      }
    })
  }, [filteredData, filteredHighlights, teamId])

  const currentMap = useMemo(() => {
    if (!selectedGameId || !filteredData.games.length) {
      return filteredData.games[0]?.mapName || 'Unknown'
    }
    return filteredData.games.find(game => game.gameId === selectedGameId)?.mapName || 'Unknown'
  }, [selectedGameId, filteredData.games])

  const heatmapKills = useMemo(() => filteredData.kills.map(kill => ({
    gameId: kill.gameId,
    killerPosition: kill.killerPosition || { x: 0, y: 0 },
    victimPosition: kill.victimPosition || { x: 0, y: 0 },
    killerId: kill.killerId,
    victimId: kill.victimId,
    killerTeamId: kill.killerTeamId,
    victimTeamId: kill.victimTeamId,
    weapon: kill.weapon,
    isFirstBlood: kill.isFirstBlood,
    roundNumber: kill.roundNumber,
    timestamp: kill.timestamp,
  })), [filteredData.kills])

  if (loading) {
    return (
      <div className="card backdrop-blur-xl bg-gray-900/70 p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-gray-400">Loading visualizations...</span>
        </div>
      </div>
    )
  }

  if (error || !evidence) {
    return (
      <div className="card backdrop-blur-xl bg-gray-900/70 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Match Visualizations</h2>
        </div>
        <p className="text-gray-400 text-center py-8">
          {error || 'No visualization data available for this match'}
        </p>
      </div>
    )
  }

  const focusTeamPlayers = playerCards.filter(player => player.teamId === teamId)
  const opponentPlayers = playerCards.filter(player => player.teamId !== teamId)

  return (
    <div className="card backdrop-blur-xl bg-gray-900/70 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Match Visualizations</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800/50 border border-gray-700 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
          <TabsTrigger value="highlights">
            Highlights
            {filteredHighlights.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                {filteredHighlights.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <WinProbabilityTimeline
            rounds={filteredData.rounds.map(round => {
              const clutch = evidence.clutchSituations?.find(situation =>
                situation.won === true &&
                situation.roundNumber === round.roundNumber &&
                situation.gameId === round.gameId
              )
              const critical = evidence.derived?.criticalRounds?.some(stat =>
                stat.gameId === round.gameId &&
                stat.topReviewRounds.some(reviewRound => reviewRound.roundNumber === round.roundNumber)
              )

              return {
                roundNumber: round.roundNumber,
                gameId: round.gameId,
                winnerTeamId: round.winnerTeamId,
                clutch: clutch ? {
                  playerName: clutch.playerName || `Player ${clutch.playerId}`,
                  situation: clutch.situation,
                  isFocusTeam: clutch.teamId === teamId,
                } : undefined,
                isCritical: critical,
              }
            })}
            teamId={teamId}
            teamName={teamNames.team}
            opponentName={teamNames.opponent}
            games={filteredData.games}
          />

          {filteredHighlights.length > 0 && (
            <HighlightReel
              highlights={filteredHighlights.slice(0, 5)}
              focusTeamName={teamNames.team}
              opponentName={teamNames.opponent}
              onRoundSelect={(round, gameId) => {
                console.log(`Selected round ${round} from game ${gameId}`)
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="heatmap">
          <KillHeatmap
            kills={heatmapKills}
            mapName={currentMap}
            teamId={teamId}
            teamName={teamNames.team}
            opponentName={teamNames.opponent}
            players={evidence.players || []}
            abilityUses={evidence.abilityUses || []}
          />
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          {focusTeamPlayers.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">{teamNames.team}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {focusTeamPlayers.map(player => (
                  <PlayerComparisonCard
                    key={player.playerId}
                    player={player}
                    teamName={teamNames.team}
                    isFocusTeam
                  />
                ))}
              </div>
            </section>
          )}
          {opponentPlayers.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">{teamNames.opponent}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {opponentPlayers.map(player => (
                  <PlayerComparisonCard
                    key={player.playerId}
                    player={player}
                    teamName={teamNames.opponent}
                    isFocusTeam={false}
                  />
                ))}
              </div>
            </section>
          )}
          {playerCards.length === 0 && (
            <p className="text-gray-400 text-center py-8">No player evidence available</p>
          )}
        </TabsContent>

        <TabsContent value="economy">
          <EconomyTimeline
            economyRounds={evidence.economyRounds || []}
            games={evidence.games || []}
            selectedGameId={selectedGameId}
            teamId={teamId}
            teamName={teamNames.team}
            opponentTeamId={teamNames.opponentId}
            opponentName={teamNames.opponent}
          />
        </TabsContent>

        <TabsContent value="rounds">
          <RoundTimeline
            rounds={roundTimelineData}
            teamName={teamNames.team}
            opponentName={teamNames.opponent}
            highlightRounds={filteredHighlights.map(highlight => ({
              gameId: highlight.gameId,
              roundNumber: highlight.roundNumber,
            }))}
          />
        </TabsContent>

        <TabsContent value="highlights">
          <HighlightReel
            highlights={filteredHighlights}
            focusTeamName={teamNames.team}
            opponentName={teamNames.opponent}
            onRoundSelect={(round, gameId) => {
              console.log(`Selected round ${round} from game ${gameId}`)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
