import {
  MatchAnalytics,
  PlayerStats,
} from '@/lib/analytics/computeMatchAnalytics'
import type { EvidenceV1 } from '@/models/Match'
import { generateCoachReport as callLLM } from './llmClient'

// Re-export types for convenience
export type { MatchAnalytics, PlayerStats }

export function buildCoachPrompt(analytics: MatchAnalytics, evidence?: EvidenceV1 | null): string {
  const {
    teamName,
    opponentName,
    map,
    eventName,
    date,
    roundsPlayed,
    teamRoundsWon,
    teamRoundsLost,
    players,
  } = analytics

  const topPlayers = [...players]
    .sort((a, b) => b.kd - a.kd || b.kills - a.kills)
    .slice(0, 3)

  const playerLines = players
    .map((p) => `${p.name}: ${p.kills}/${p.deaths} (KD ${p.kd.toFixed(2)})`)
    .join('\n')

  const topPlayerLines = topPlayers
    .map(
      (p) =>
        `${p.name} - KD ${p.kd.toFixed(2)}, Kills ${p.kills}, Deaths ${p.deaths}`
    )
    .join('\n')

  // Build evidence section if available
  let evidenceSection = ''
  if (evidence) {
    evidenceSection = `
EVIDENCE (Advanced Metrics from GRID):

First Blood Stats:
${evidence.derived?.firstBloodStats?.map((fb: any) =>
  `- ${fb.teamName}: ${fb.firstBloods} first bloods, ${fb.roundsWon} rounds won (${(fb.conversionRate * 100).toFixed(1)}% conversion)`
).join('\n') || 'No data'}

Plant Stats:
${evidence.derived?.plantStats?.map((p: any) =>
  `- ${p.teamName}: ${p.plants} plants, ${p.postPlantWins} post-plant wins (${(p.postPlantWinRate * 100).toFixed(1)}% win rate)`
).join('\n') || 'No data'}

Isolated Deaths (Top 5):
${evidence.players
  ?.sort((a: any, b: any) => b.isolatedDeathsCount - a.isolatedDeathsCount)
  .slice(0, 5)
  .map((p: any) => {
    const name = p.playerName || `Player ${p.playerId}`
    const percentage = p.deaths > 0 ? ((p.isolatedDeathsCount / p.deaths) * 100).toFixed(1) : '0.0'
    return `- ${name}: ${p.isolatedDeathsCount} isolated deaths out of ${p.deaths} total (${percentage}%)`
  })
  .join('\n') || 'No data'}
`

    // Add site-specific stats if available
    if (evidence?.derived?.siteStats && evidence.derived.siteStats.length > 0) {
      evidenceSection += `
Site-Specific Performance:
${evidence.derived.siteStats.map((s: any) =>
  `- Site ${s.site}: ${s.plants} plants, ${(s.postPlantWinRate * 100).toFixed(0)}% post-plant win rate`
).join('\n')}
`
    }

    // Add clutch stats if available
    if (evidence?.derived?.clutchStats && evidence.derived.clutchStats.length > 0) {
      evidenceSection += `
Clutch Performance (1vX situations):
${evidence.derived.clutchStats.slice(0, 5).map((c: any) => {
  const breakdownStr = Object.entries(c.breakdown)
    .map(([situation, stats]: [string, any]) => `${situation}: ${stats.wins}/${stats.attempts}`)
    .join(', ')
  return `- ${c.playerName}: ${c.clutchWins}/${c.clutchAttempts} clutches won (${(c.clutchRate * 100).toFixed(1)}%) - ${breakdownStr}`
}).join('\n')}
`
    }

    // Add economy stats if available
    if (evidence?.derived?.economyStats && evidence.derived.economyStats.length > 0) {
      evidenceSection += `
Economy Performance:
${evidence.derived.economyStats.map((e: any) => {
  const fullBuy = e.byTier?.full_buy || { rounds: 0, wins: 0, winRate: 0 }
  const eco = e.byTier?.eco || { rounds: 0, wins: 0, winRate: 0 }
  const save = e.byTier?.save || { rounds: 0, wins: 0, winRate: 0 }
  const forceAfterPistol = e.forceAfterPistolLoss || { attempts: 0, wins: 0, winRate: 0 }

  return `- ${e.teamName}:
  Full Buy: ${fullBuy.wins}/${fullBuy.rounds} (${(fullBuy.winRate * 100).toFixed(0)}%)
  Eco/Save: ${eco.wins + save.wins}/${eco.rounds + save.rounds} (${(((eco.wins + save.wins) / (eco.rounds + save.rounds || 1)) * 100).toFixed(0)}%)${forceAfterPistol.attempts > 0 ? `
  Force after pistol loss: ${forceAfterPistol.wins}/${forceAfterPistol.attempts} (${(forceAfterPistol.winRate * 100).toFixed(0)}%)` : ''}`
}).join('\n')}
`
    }

    // Add ability usage stats if available
    if (evidence?.derived?.abilityStats && evidence.derived.abilityStats.length > 0) {
      evidenceSection += `
Ability Usage (Top 5 players):
${evidence.derived.abilityStats.slice(0, 5).map((p: any) => {
  const topAgent = p.agentBreakdown[0]
  const topAbilities = topAgent?.abilities.slice(0, 3).map((a: any) => `${a.name}: ${a.uses}`).join(', ')
  return `- ${p.playerName} (${topAgent?.agent}): ${p.abilitiesPerRound} abilities/round [${topAbilities}]`
}).join('\n')}
`
    }

    // Add trade kill analysis if available
    if (evidence?.derived?.tradeStats && evidence.derived.tradeStats.length > 0) {
      // Sort by traded rate (lowest first = most problematic)
      const sortedByTraded = [...evidence.derived.tradeStats]
        .filter((p: any) => p.deaths >= 5)  // Only players with significant deaths
        .sort((a: any, b: any) => a.tradedRate - b.tradedRate)

      const worstTraded = sortedByTraded.slice(0, 3)
      const bestTraders = [...evidence.derived.tradeStats]
        .sort((a: any, b: any) => b.tradesGotten - a.tradesGotten)
        .slice(0, 3)

      evidenceSection += `
Trade Kill Analysis:
${worstTraded.length > 0 ? `Players with lowest trade rates (vulnerable positioning):
${worstTraded.map((p: any) =>
  `- ${p.playerName}: ${(p.tradedRate * 100).toFixed(0)}% traded (${p.deathsTraded}/${p.deaths} deaths traded, ${p.untradedDeaths} untraded)`
).join('\n')}` : ''}
${bestTraders.length > 0 && bestTraders[0].tradesGotten > 0 ? `
Best traders (team coordination):
${bestTraders.filter((p: any) => p.tradesGotten > 0).map((p: any) =>
  `- ${p.playerName}: ${p.tradesGotten} trades gotten for teammates`
).join('\n')}` : ''}
`
    }

    // Add opening duel analysis if available
    if (evidence?.derived?.openingDuelStats && evidence.derived.openingDuelStats.length > 0) {
      // Filter to significant sample size
      const significantPlayers = evidence.derived.openingDuelStats.filter((p: any) => p.openingDuels >= 5)

      // Best overall
      const bestOverall = [...significantPlayers]
        .sort((a: any, b: any) => b.openingDuelWinRate - a.openingDuelWinRate)
        .slice(0, 3)

      // Best on attack
      const bestAttack = [...significantPlayers]
        .filter((p: any) => p.attackOpeningDuels >= 3)
        .sort((a: any, b: any) => b.attackOpeningWinRate - a.attackOpeningWinRate)
        .slice(0, 3)

      // Worst performers (struggling in opening duels)
      const worst = [...significantPlayers]
        .sort((a: any, b: any) => a.openingDuelWinRate - b.openingDuelWinRate)
        .slice(0, 3)

      evidenceSection += `
Opening Duel Analysis:
${bestOverall.length > 0 ? `Best opening duel performers:
${bestOverall.map((p: any) =>
  `- ${p.playerName}: ${(p.openingDuelWinRate * 100).toFixed(0)}% win rate (${p.openingKills}K/${p.openingDeaths}D in ${p.openingDuels} duels)`
).join('\n')}` : ''}
${bestAttack.length > 0 ? `
Attack side specialists:
${bestAttack.map((p: any) =>
  `- ${p.playerName}: ${(p.attackOpeningWinRate * 100).toFixed(0)}% on attack (${p.attackOpeningKills}K/${p.attackOpeningDeaths}D)`
).join('\n')}` : ''}
${worst.length > 0 ? `
Players struggling in opening duels:
${worst.map((p: any) =>
  `- ${p.playerName}: ${(p.openingDuelWinRate * 100).toFixed(0)}% win rate (${p.openingKills}K/${p.openingDeaths}D) - conversion: ${(p.openingKillConversion * 100).toFixed(0)}%`
).join('\n')}` : ''}
`
    }

    // Add multi-kill analysis if available
    if (evidence?.derived?.multiKillStats && evidence.derived.multiKillStats.length > 0) {
      // Filter to players with at least one multi-kill
      const playersWithMultiKills = evidence.derived.multiKillStats.filter((p: any) => p.totalMultiKills > 0)

      if (playersWithMultiKills.length > 0) {
        // Sort by impact score and take top 5
        const topMultiKillers = playersWithMultiKills
          .sort((a: any, b: any) => b.impactScore - a.impactScore)
          .slice(0, 5)

        evidenceSection += `
Multi-Kill Performance (High Impact Rounds):
${topMultiKillers.map((p: any) => {
  const breakdown: string[] = []
  if (p.aces > 0) breakdown.push(`${p.aces} ace${p.aces > 1 ? 's' : ''}`)
  if (p.fourKs > 0) breakdown.push(`${p.fourKs} 4k${p.fourKs > 1 ? 's' : ''}`)
  if (p.threeKs > 0) breakdown.push(`${p.threeKs} 3k${p.threeKs > 1 ? 's' : ''}`)
  if (p.twoKs > 0) breakdown.push(`${p.twoKs} 2k${p.twoKs > 1 ? 's' : ''}`)

  return `- ${p.playerName}: Impact ${p.impactScore} [${breakdown.join(', ')}]`
}).join('\n')}
`
      }
    }

    // Add agent compositions if available
    if (evidence.agentCompositions && Object.keys(evidence.agentCompositions).length > 0) {
      evidenceSection += `
Agent Compositions:
${evidence.games.map((game: any, idx: number) => {
  const composition = evidence.agentCompositions?.[game.gameId]
  if (!composition || composition.length === 0) return null

  // Group by team
  const teamGroups = composition.reduce((acc: any, pick: any) => {
    if (!acc[pick.teamId]) acc[pick.teamId] = []
    acc[pick.teamId].push(pick)
    return acc
  }, {})

  const teamLines = Object.entries(teamGroups).map(([teamId, picks]: [string, any]) => {
    const agents = picks.map((p: any) => p.agent).join(', ')
    return `  - Team ${teamId}: ${agents}`
  }).join('\n')

  return `Game ${idx + 1} (${game.mapName}):\n${teamLines}`
}).filter(Boolean).join('\n') || 'No data'}
`
    }
  }

  // Add attack/defense stats if available
  if (analytics.roundStats) {
    evidenceSection += `
Attack/Defense Performance:
- Attack Win Rate: ${(analytics.roundStats.attackWinRate * 100).toFixed(1)}% (${analytics.roundStats.attackWins}/${analytics.roundStats.attackTotal} rounds)
- Defense Win Rate: ${(analytics.roundStats.defenseWinRate * 100).toFixed(1)}% (${analytics.roundStats.defenseWins}/${analytics.roundStats.defenseTotal} rounds)
`
  }

  // Add overall first blood conversion and post-plant win rate if available
  if (analytics.firstBloodConversion !== undefined || analytics.postPlantWinRate !== undefined) {
    evidenceSection += `
${analytics.teamName} Overall Performance:
${analytics.firstBloodConversion !== undefined ? `- First Blood Conversion: ${(analytics.firstBloodConversion * 100).toFixed(1)}%` : ''}
${analytics.postPlantWinRate !== undefined ? `- Post-Plant Win Rate: ${(analytics.postPlantWinRate * 100).toFixed(1)}%` : ''}
`
  }

  // Check if this is a map-filtered report
  const isMapFiltered = evidence?.meta?.filteredForGame
  const mapName = evidence?.meta?.mapName || map

  return `
You are an assistant coach for a professional Valorant team.

You are reviewing ${isMapFiltered ? `a single MAP (${mapName}) from a series` : 'a single match'} for ${teamName} against ${opponentName}.
${isMapFiltered ? `NOTE: All statistics below are filtered to ONLY this map. Use this for map-specific tactical analysis.` : ''}
Use the structured stats below to produce a concise and practical coaching report.

Match context:
- Event: ${eventName ?? 'Unknown event'}
- Date: ${date}
- Map: ${mapName}
- Final score: ${teamRoundsWon} - ${teamRoundsLost} over ${roundsPlayed} rounds

Player stat lines:
${playerLines}

Top performers (by KD):
${topPlayerLines}
${evidenceSection}
Guidelines:
- Assume you are talking to the coaching staff, not directly to the players.
- Focus on patterns, decision making and macro tendencies, not just raw aim.
- Do not invent stats that are not provided. If something is missing, ignore it.
- Make feedback specific and actionable.
- Use the EVIDENCE section to ground your insights in data about first bloods, plant situations, isolated deaths, site-specific performance, clutch situations, economy management, ability usage, multi-kill impact, and agent compositions.
- When agent compositions are provided, consider how team compositions might have influenced outcomes.
- When site stats are provided, identify which sites teams favor and their success rates on each.
- When clutch stats are provided, identify which players excel in high-pressure 1vX situations.
- When economy stats are provided, analyze buy decisions, force buy success rates, and economic discipline.
- When ability usage stats are provided, identify players who may be over/under-utilizing agent abilities.
- When multi-kill stats are provided, identify players who can turn rounds with high-kill performances. Aces and 4ks are especially impactful.
- Analyze trade patterns: players with low traded rates may be over-extending or taking isolated fights.
- High trade-getters indicate good team coordination and positioning.
- Analyze opening duel patterns: players with high opening kill rates on attack may be good entry fraggers.
- Compare attack vs defense opening performance to identify role fit.
- Low opening death survival indicates poor team support when entry player dies.

Output format (MUST follow this structure):

## EVIDENCE
- List 3-5 key data points from the match stats above
- Focus on patterns like first blood conversion, plant success rate, isolated deaths, site-specific performance, clutch performance, economy management, ability usage, multi-kill impact, opening duels, agent compositions, trade kill patterns

## INSIGHT
- 2-4 bullet points analyzing what these patterns reveal about team play
- Connect the evidence to tactical decisions or positioning issues

## RECOMMENDATION
- 3-5 actionable practice items or focus areas for the next session
- Be specific: reference situations from the evidence (e.g., "work on post-plant setups given only 68% win rate")
  `.trim()
}

export async function generateCoachingReport(
  analytics: MatchAnalytics,
  evidence?: EvidenceV1 | null
): Promise<string> {
  const prompt = buildCoachPrompt(analytics, evidence)
  return callLLM(prompt)
}
