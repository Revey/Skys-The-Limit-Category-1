import {
  MatchAnalytics,
  PlayerStats,
} from '@/lib/analytics/computeMatchAnalytics'
import { generateCoachReport as callLLM } from './llmClient'

// Re-export types for convenience
export type { MatchAnalytics, PlayerStats }

export function buildCoachPrompt(analytics: MatchAnalytics): string {
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

Guidelines:
- Assume you are talking to the coaching staff, not directly to the players.
- Focus on patterns, decision making and macro tendencies, not just raw aim.
- Do not invent stats that are not provided. If something is missing, ignore it.
- Make feedback specific and actionable.

Output format:
1. High level summary
   - 2 to 4 bullet points about what went well and what went poorly.

2. Player specific notes
   - 1 to 2 very short bullet points for each player mentioning their impact based on kills, deaths and KD.

3. Practice and focus areas
   - 3 to 5 bullet points suggesting what to review or drill in the next practice based on this match.
  `.trim()
}

export async function generateCoachingReport(
  analytics: MatchAnalytics
): Promise<string> {
  const prompt = buildCoachPrompt(analytics)
  return callLLM(prompt)
}
