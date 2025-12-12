export async function generateCoachReport(prompt: string): Promise<string> {
  const useMock = process.env.COACH_MOCK === 'true'

  if (useMock) {
    return `## Evidence

• **Rotation timing data** — Defense rotations averaged 4+ seconds after initial contact calls, resulting in 1v2 or 1v3 retake situations in 6 of 13 defensive rounds.

• **Attack-side execute patterns** — The default A-site execute was used in 8 of 12 attack rounds. Opponents began pre-positioning utility by round 15, countering 5 consecutive entries.

• **Trade efficiency metrics** — Entry fragger eliminations were traded within 2 seconds only 40% of the time. Teammates were positioned 15+ meters back during entries, leading to repeated 4v5 situations.

• **Player performance breakdown** — Jakee: 18K/12D (1.50 KD) but 7 deaths in isolated positions. eeiu: 14K/10D with 3 late smoke placements on executes. Xeppaa: 12K/8D, dart usage on retakes netted info in only 2 of 6 attempts. runi: 10K/11D, turret placement predicted by opponents in 4 rounds. moose: 11K/9D, Dizzy used 2+ seconds early in 5 rounds.

## Insight

• **Defensive communication breakdown** — Late rotations indicate information is not being shared quickly enough when opponents fake site takes. The team is over-committing to initial contact before confirming enemy positions.

• **Predictability on attack** — Over-reliance on the default A execute has made the team readable. Opponents have identified the timing windows and pre-positioned utility accordingly.

• **Spacing issues impacting trades** — Entry fraggers are dying in positions where teammates cannot follow up. This suggests a coordination gap between the entry player and the second-in.

## Recommendation

1. **Implement 2-second rotation protocol** — When initial contact is called, one player should rotate immediately while others hold for confirmation. Run retake drills (3v3, 4v4) focusing on staggered utility and trading.

2. **Develop 2-3 execute variations per site** — Create alternative timings and entry points. Assign one player to track which executes have been used and call for variation.

3. **Close entry spacing to 8-10 meters** — Second player should be positioned to trade within 1.5 seconds. Practice entry sequences in custom games with explicit trade responsibilities.

4. **VOD review: 5 closest round losses** — Identify decision points where different rotations or execute calls could have changed outcomes. Focus on communication timestamps.`
  }

  throw new Error('Real LLM integration not configured yet')
}
