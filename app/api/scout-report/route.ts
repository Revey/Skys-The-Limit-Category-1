import { NextRequest, NextResponse } from 'next/server'
import {
  aggregateTeamTendencies,
  type AverageMetric,
  type RateMetric,
  type TeamTendencies,
} from '@/lib/analytics/aggregateTeamTendencies'
import { getLeagueBenchmarks } from '@/lib/analytics/leagueBenchmarks'
import type { PercentileResult } from '@/lib/analytics/leagueBenchmarks'
import { getTeamSeriesDerived } from '@/lib/analytics/getTeamSeriesDerived'
import { generateCoachReport } from '@/lib/ai/llmClient'
import { connectToDB } from '@/lib/db'
import { normalizeTeamName } from '@/lib/teamUtils'

export const maxDuration = 60

function rateFact(metric: RateMetric, leagueContext?: PercentileResult | null) {
  return {
    percent: Number((metric.rate * 100).toFixed(0)),
    n: metric.denominator,
    numerator: metric.numerator,
    ...(leagueContext === undefined || leagueContext === null
      ? {}
      : {
          percentile: leagueContext.percentile,
          leagueTeamCount: leagueContext.teamCount,
          leagueMedianPercent: Number((leagueContext.median * 100).toFixed(0)),
        }),
  }
}

function averageFact(metric: AverageMetric) {
  return {
    average: Number(metric.average.toFixed(1)),
    n: metric.denominator,
  }
}

function mapPoolFacts(mapPool: TeamTendencies['mapPool']) {
  return mapPool.map(map => ({
    map: map.map,
    seriesPlayed: map.seriesPlayed,
    gamesPlayed: map.gamesPlayed,
    gamesWon: map.gamesWon,
    winRate: rateFact(map.winRate),
  }))
}

interface ScoutingContext {
  opponentTeamName: string
  focusTeamId?: string
  focusTeamName?: string
  focusTeamTendencies?: TeamTendencies
}

function buildFacts(
  tendencies: TeamTendencies,
  pistolPercentile: PercentileResult | null,
  antiEcoPercentile: PercentileResult | null,
  context: ScoutingContext
) {
  return {
    teamId: tendencies.teamId,
    teamName: context.opponentTeamName,
    seriesCount: tendencies.seriesCount,
    mapPool: mapPoolFacts(tendencies.mapPool),
    ...(context.focusTeamId
      ? {
          focusTeamId: context.focusTeamId,
          focusTeamName: context.focusTeamName || `Team ${context.focusTeamId}`,
          focusTeamSeriesCount: context.focusTeamTendencies?.seriesCount ?? 0,
          focusTeamMapPool: mapPoolFacts(context.focusTeamTendencies?.mapPool ?? []),
        }
      : {}),
    pistols: {
      overall: rateFact(tendencies.pistols.overall, pistolPercentile),
      attack: rateFact(tendencies.pistols.attack),
      defense: rateFact(tendencies.pistols.defense),
      bonusConversion: rateFact(tendencies.pistols.bonusConversion),
      lostToForce: rateFact(tendencies.pistols.lostToForce),
      topFraggers: tendencies.pistols.topFraggers.map(player => ({
        ...player,
        n: player.pistolKills + player.pistolDeaths,
      })),
    },
    economy: {
      byTier: Object.fromEntries(
        Object.entries(tendencies.economy.byTier).map(([tier, value]) => [
          tier,
          {
            rounds: value.rounds,
            wins: value.wins,
            winRate: rateFact(value.winRate),
          },
        ])
      ),
      afterLoss: Object.fromEntries(
        Object.entries(tendencies.economy.afterLoss).map(([tier, value]) => [
          tier,
          {
            rounds: value.rounds,
            wins: value.wins,
            winRate: rateFact(value.winRate),
          },
        ])
      ),
      afterLossForceRate: rateFact(tendencies.economy.afterLossForceRate),
      forceAfterPistolLoss: rateFact(tendencies.economy.forceAfterPistolLoss),
      ecoUpsetWinRate: rateFact(tendencies.economy.ecoUpsetWinRate),
    },
    tempo: {
      avgTimeToPlantSeconds: averageFact(tendencies.tempo.avgTimeToPlant),
      latePlantRate: rateFact(tendencies.tempo.latePlantRate),
      earlyAggressionRate: rateFact(tendencies.tempo.earlyAggressionRate),
      byTempo: Object.fromEntries(
        Object.entries(tendencies.tempo.byTempo).map(([tempo, value]) => [
          tempo,
          {
            rounds: value.rounds,
            wins: value.wins,
            winRate: rateFact(value.winRate),
          },
        ])
      ),
    },
    sites: tendencies.sites.map(site => ({
      site: site.site,
      attackPlants: site.attackPlants,
      postPlantWins: site.postPlantWins,
      postPlantWinRate: rateFact(site.postPlantWinRate),
      defenseAttempts: site.defenseAttempts,
      defenseWins: site.defenseWins,
      defenseWinRate: rateFact(site.defenseWinRate),
      preferenceShare: rateFact(site.preferenceShare),
    })),
    entryPlayers: tendencies.entryPlayers.map(player => ({
      playerId: player.playerId,
      playerName: player.playerName,
      entryAttempts: player.entryAttempts,
      entryKills: player.entryKills,
      entryDeaths: player.entryDeaths,
      entrySuccessRate: rateFact(player.entrySuccessRate),
      deathsTraded: player.deathsTraded,
      tradeRate: rateFact(player.tradeRate),
    })),
    spikeCarriers: {
      plantRate: rateFact(tendencies.spikeCarriers.plantRate),
      carrierDeathRate: rateFact(tendencies.spikeCarriers.carrierDeathRate),
      spikeDrops: tendencies.spikeCarriers.spikeDrops,
      byPlayer: tendencies.spikeCarriers.byPlayer.map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        roundsAsCarrier: player.roundsAsCarrier,
        successfulPlants: player.successfulPlants,
        deathsBeforePlant: player.deathsBeforePlant,
        plantRate: rateFact(player.plantRate),
        carrierDeathRate: rateFact(player.carrierDeathRate),
      })),
    },
    antiEco: {
      winRate: rateFact(tendencies.antiEco.winRate, antiEcoPercentile),
      deathsToEco: tendencies.antiEco.deathsToEco,
      deathsToForce: tendencies.antiEco.deathsToForce,
      problematicWeapons: tendencies.antiEco.problematicWeapons,
    },
  }
}

function buildPrompt(facts: ReturnType<typeof buildFacts>): string {
  const audienceContext = facts.focusTeamId
    ? `You are scouting ${facts.teamName} FOR the coaching staff of ${facts.focusTeamName}. Every Recommendation must be a concrete counter-prep action for ${facts.focusTeamName}: specify at least one actionable target, timing, utility or composition adjustment, or practice drill. Never give generic advice.`
    : `You are scouting ${facts.teamName} from a neutral perspective. Write a concise, auditable pre-match report without assuming a focus team.`

  const mapPoolInstruction = facts.focusTeamId
    ? `Base both Suggested Ban/Pick bullets on a direct comparison of mapPool (${facts.teamName}) and focusTeamMapPool (${facts.focusTeamName}). Treat their strong map plus our weak map as a ban candidate; treat their weak map plus our strong map as a pick candidate. Each bullet must cite both teams' displayed win rates and sample sizes.`
    : 'Base Suggested Ban/Pick bullets on the opponent mapPool only, and do not imply that focus-team map-pool data exists.'

  return `You are a professional Valorant scout.

AUDIENCE AND ACTIONABILITY
${audienceContext}

EVIDENCE AND CITATIONS
Use ONLY the facts in the JSON block below. Do not invent, infer, estimate, or introduce any number absent from the facts. Every factual claim must have an inline citation with the exact displayed value and denominator, plus the percentile whenever supplied, in the form "(54% pistol WR, n=158, P85)". Use supplied integer percentages exactly; do not recalculate or add precision. For count-only claims, cite the count and its relevant sample size. No uncited claims are allowed.

PERCENTILES
Interpret P>=75 as a league strength and P<=25 as a league weakness. Prioritize the most extreme percentiles (furthest from P50) when selecting exploitable weaknesses and dangers.

SAMPLE DISCIPLINE
Never base any claim on a fact with n<8. When 8<=n<30, the claim must include the exact phrase "small sample". Prefer high-n facts (n>=30) over lower-sample facts.

PLAYER SPECIFICITY
At least one bullet in Exploitable Weaknesses or Dangers To Respect must name a specific player from entryPlayers, pistols.topFraggers, or spikeCarriers.byPlayer and cite that player's numbers with an eligible n>=8.

MAP-POOL COMPARISON
${mapPoolInstruction}

Return no more than 450 words and exactly these four sections, in this order:

## Identity
Write 2-3 sentences.

## Exploitable Weaknesses
Write exactly 3 bullets. Each bullet must explicitly follow: Evidence → Insight → Recommendation.

## Dangers To Respect
Write exactly 2 bullets. Each bullet must explicitly follow: Evidence → Insight → Recommendation.

## Suggested Ban/Pick Considerations
Write exactly 2 map-pool-based bullets following the map-pool instruction above.

Do not add an introduction, conclusion, extra section, hedging filler, or uncited claims.

FACTS JSON:
${JSON.stringify(facts, null, 2)}`
}

interface ScoutReportRequestBody {
  teamId?: unknown
  opponentTeamName?: unknown
  focusTeamId?: unknown
  focusTeamName?: unknown
}

function bodyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function teamNameFromSeries(
  series: Awaited<ReturnType<typeof getTeamSeriesDerived>>,
  teamId: string
): string {
  for (const item of series) {
    const team = item.derived?.mapsStats?.find(stat => stat.teamId === teamId && stat.teamName.trim())
    if (team) return normalizeTeamName(team.teamName)
  }

  return ''
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { message: 'Gemini is not configured. Set GEMINI_API_KEY to generate a scouting report.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 })
  }

  const requestBody = body as ScoutReportRequestBody
  const teamId = bodyString(requestBody?.teamId)
  const requestedOpponentTeamName = bodyString(requestBody?.opponentTeamName)
  const focusTeamId = bodyString(requestBody?.focusTeamId)
  const requestedFocusTeamName = bodyString(requestBody?.focusTeamName)

  if (!teamId) {
    return NextResponse.json({ message: 'teamId is required.' }, { status: 400 })
  }

  try {
    await connectToDB()
    const [series, focusTeamSeries] = await Promise.all([
      getTeamSeriesDerived(teamId),
      focusTeamId ? getTeamSeriesDerived(focusTeamId) : Promise.resolve([]),
    ])

    if (series.length === 0) {
      return NextResponse.json(
        { message: `No series found for team ${teamId}.` },
        { status: 404 }
      )
    }

    const tendencies = aggregateTeamTendencies(series, teamId)
    const benchmarks = await getLeagueBenchmarks()
    const pistolPercentile = benchmarks.percentileFor(teamId, 'pistolWR')
    const antiEcoPercentile = benchmarks.percentileFor(teamId, 'antiEcoWR')
    const opponentTeamName = requestedOpponentTeamName || teamNameFromSeries(series, teamId) || `Team ${teamId}`
    const focusTeamName = focusTeamId
      ? requestedFocusTeamName || teamNameFromSeries(focusTeamSeries, focusTeamId) || `Team ${focusTeamId}`
      : undefined
    const focusTeamTendencies = focusTeamId
      ? aggregateTeamTendencies(focusTeamSeries, focusTeamId)
      : undefined
    const factsUsed = buildFacts(tendencies, pistolPercentile, antiEcoPercentile, {
      opponentTeamName,
      focusTeamId: focusTeamId || undefined,
      focusTeamName,
      focusTeamTendencies,
    })
    const report = await generateCoachReport(buildPrompt(factsUsed))

    return NextResponse.json({
      report,
      factsUsed,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate scouting report', error)
    return NextResponse.json(
      { message: 'Failed to generate scouting report.' },
      { status: 500 }
    )
  }
}
