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
  .map((p: any) =>
    `- Player ${p.playerId}: ${p.isolatedDeathsCount} isolated deaths out of ${p.deaths} total (${((p.isolatedDeathsCount / p.deaths) * 100).toFixed(1)}%)`
  )
  .join('\n') || 'No data'}
`
  }

  return `
You are an assistant coach for a professional Valorant team.

You are reviewing a single match for ${teamName} against ${opponentName}.
Use the structured stats below to produce a concise and practical coaching report.

Match context:
- Event: ${eventName ?? 'Unknown event'}
- Date: ${date}
- Map: ${map}
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
- Use the EVIDENCE section to ground your insights in data about first bloods, plant situations, and isolated deaths.

Output format (MUST follow this structure):

## EVIDENCE
- List 3-5 key data points from the match stats above
- Focus on patterns like first blood conversion, plant success rate, isolated deaths

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
