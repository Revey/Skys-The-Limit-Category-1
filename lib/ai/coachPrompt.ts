import type { MatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'

export function buildCoachPrompt(analytics: MatchAnalytics): string {
  const playerLines = analytics.players
    .map(
      (p) =>
        `  - ${p.name} (${p.agent ?? 'Unknown'}): ${p.kills}K / ${p.deaths}D / ${p.assists}A — KD: ${p.kd.toFixed(2)}`
    )
    .join('\n')

  return `You are an expert Valorant coach analyzing a professional match.

## Match Summary

- Team: ${analytics.teamName}
- Opponent: ${analytics.opponentName}
- Map: ${analytics.map}
- Event: ${analytics.eventName ?? 'N/A'}
- Date: ${analytics.date}
- Result: ${analytics.teamRoundsWon} - ${analytics.teamRoundsLost} (${analytics.roundsPlayed} rounds played)

## Player Performance

${playerLines}

## Coaching Analysis Request

Based on this match data, please provide:

1. **Top 3 Issues for the Team**
   Identify the three most significant problems or weaknesses the team displayed in this match.

2. **Individual Player Focus Points**
   For each player, give 1-2 specific areas they should focus on improving based on their performance.

3. **Practice Priorities**
   Suggest 3 concrete practice drills or focus areas the team should prioritize in their next training session to address the issues identified above.

Please be specific and actionable in your recommendations.`
}
