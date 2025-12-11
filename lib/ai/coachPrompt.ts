import type { MatchAnalytics } from '../analytics/computeMatchAnalytics'

export function buildCoachPrompt(analytics: MatchAnalytics): string {
  const { win, rounds, attackWinRate, defenseWinRate, topPlayers, notes } = analytics
  const teams = (analytics as { teams?: string }).teams ?? 'Team vs Opponent'
  const map = (analytics as { map?: string }).map ?? 'unspecified map'
  const event = (analytics as { event?: string }).event ?? 'recent event'
  const result = win ? 'win' : 'loss'

  const playerStats = topPlayers
    .map(
      (player) =>
        `- ${player.name}: rating ${player.rating.toFixed(2)}, ${player.kills}K/${player.deaths}D`
    )
    .join('\n')

  return [
    'You are an assistant coach generating a concise report.',
    `Match overview: ${teams} on ${map} at ${event}. Result: ${result} over ${rounds} rounds.`,
    `Side performance: Attack win rate ${attackWinRate}%, defense win rate ${defenseWinRate}%.`,
    'Player stats:',
    playerStats || '- No player stats available.',
    `Notes: ${notes}`,
    'Tasks:',
    '- Identify the top 3 issues for the team based on the summary.',
    '- Provide 1-2 specific focus points for each player mentioned.',
    '- Suggest 3 concrete practice priorities for the next scrim.',
  ].join('\n')
}
