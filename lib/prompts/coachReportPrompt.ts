import type { MatchAnalytics } from '@/lib/analytics/computeMatchAnalytics'

function formatTopPlayers(topPlayers: MatchAnalytics['topPlayers']): string {
  if (!topPlayers.length) return 'No player data provided.'
  return topPlayers
    .map(
      (player) =>
        `${player.name}: rating ${player.rating.toFixed(2)}, kills ${player.kills}, deaths ${player.deaths}`,
    )
    .join('\n')
}

export function buildCoachPrompt(analytics: MatchAnalytics): string {
  const playerSection = formatTopPlayers(analytics.topPlayers)
  return [
    'You are the Cloud9 Valorant coaching assistant. Use the match analytics below to provide a concise, tactical report.',
    '',
    'Match Overview:',
    `- Result: ${analytics.win ? 'Win' : 'Loss'}`,
    `- Rounds Played: ${analytics.rounds}`,
    `- Attack Win Rate: ${analytics.attackWinRate}%`,
    `- Defense Win Rate: ${analytics.defenseWinRate}%`,
    '',
    'Top Performers:',
    playerSection,
    '',
    'Notes:',
    analytics.notes || 'No additional notes provided.',
    '',
    'Provide: a high-level narrative, two tactical priorities, and two player-specific action items. Keep it under 250 words.',
  ].join('\n')
}
