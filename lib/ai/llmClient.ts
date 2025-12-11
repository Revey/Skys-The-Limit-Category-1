export async function generateCoachReport(prompt: string): Promise<string> {
  const useMock = process.env.COACH_MOCK === 'true'

  if (useMock) {
    return `## Top 3 Issues for the Team

• **Late rotations on defense** — The team consistently rotated too slowly when the opponent faked a site take, leading to 1v2 or 1v3 situations on retakes. Communication on enemy positioning needs to be faster and more decisive.

• **Predictable attack-side executes** — The default A-site execute was used too frequently without variation. Opponents began pre-positioning utility to counter, resulting in several failed entries in the second half.

• **Poor trade efficiency** — When the entry fragger was eliminated, teammates were often too far back to secure refrag opportunities. This left the team in repeated 4v5 situations.

## Individual Player Focus Points

• **Jakee** — Strong entry numbers but deaths were often in isolated positions. Focus on communicating when pushing aggressively so teammates can follow up.

• **eeiu** — Solid support play but smokes were sometimes late on executes. Work on pre-placing smokes during the setup phase to speed up site takes.

• **Xeppaa** — Excellent info gathering but dart usage on retakes could be more impactful. Practice lineups for common post-plant positions.

• **runi** — Turret placement was predictable. Experiment with off-angle setups to catch opponents off-guard. Also focus on staying alive longer in post-plant.

• **moose** — Good utility usage but Dizzy was often used too early, giving opponents time to recover. Coordinate flash timing with entry fraggers.

## Practice Priorities

1. **Retake drills with staggered utility** — Run 3v3 and 4v4 retake scenarios focusing on coordinated utility usage and trading.

2. **Execute variation workshop** — Develop 2-3 alternative executes for each site with different timings and entry points.

3. **VOD review on lost rounds** — Analyze the 5 closest round losses to identify decision points where different calls could have changed the outcome.`
  }

  throw new Error('Real LLM integration not configured yet')
}
