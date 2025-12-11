import type { MatchAnalytics } from '../analytics/computeMatchAnalytics'

export type CoachReportContext = MatchAnalytics

export async function generateCoachReport(prompt: string): Promise<string> {
  const useMock = process.env.COACH_MOCK === 'true'

  if (useMock) {
    return `Coaching Report (Mock)\n\n${
      'Overall, the team showed strong mid-round adjustments but struggled to close out attack halves. ' +
      'Defensive setups were solid yet predictable, allowing opponents to read rotations.'
    }\n\n${
      'Player Focus:\n- PlayerA: Prioritize first duel consistency and communicate utility timing.\n' +
      '- PlayerB: Work on post-plant positioning and crossfire discipline.\n' +
      '- PlayerC: Improve mid-round reads and avoid isolated engagements.'
    }\n\n${
      'Practice Priorities:\n1) Rehearse two new attack default variations with faster pivot timings.\n' +
      '2) Drill retake protocols on sites with staggered utility usage.\n' +
      '3) Conduct review sessions on losing rounds to tighten mid-round calls.'
    }`
  }

  throw new Error('LLM provider is not configured. Set COACH_MOCK="true" to enable mock responses.')
}
