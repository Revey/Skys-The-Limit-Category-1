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

function buildFacts(
  tendencies: TeamTendencies,
  pistolPercentile: PercentileResult | null,
  antiEcoPercentile: PercentileResult | null
) {
  return {
    teamId: tendencies.teamId,
    seriesCount: tendencies.seriesCount,
    mapPool: tendencies.mapPool.map(map => ({
      map: map.map,
      seriesPlayed: map.seriesPlayed,
      gamesPlayed: map.gamesPlayed,
      gamesWon: map.gamesWon,
      winRate: rateFact(map.winRate),
    })),
    pistols: {
      overall: rateFact(tendencies.pistols.overall, pistolPercentile),
      attack: rateFact(tendencies.pistols.attack),
      defense: rateFact(tendencies.pistols.defense),
      bonusConversion: rateFact(tendencies.pistols.bonusConversion),
      lostToForce: rateFact(tendencies.pistols.lostToForce),
      topFraggers: tendencies.pistols.topFraggers,
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
    antiEco: {
      winRate: rateFact(tendencies.antiEco.winRate, antiEcoPercentile),
      deathsToEco: tendencies.antiEco.deathsToEco,
      deathsToForce: tendencies.antiEco.deathsToForce,
      problematicWeapons: tendencies.antiEco.problematicWeapons,
    },
  }
}

function buildPrompt(facts: ReturnType<typeof buildFacts>): string {
  return `You are a professional Valorant scout writing a concise, auditable pre-match report.

Use ONLY the facts in the JSON block below. Do not invent, infer, estimate, or introduce any number that is absent from the facts. Every factual claim must include an inline citation containing the exact displayed value, denominator, and percentile when one is provided, for example "(54% pistol WR, n=158, P85)". Use the supplied integer percentages exactly; do not recalculate or add decimal precision. For count-only claims, cite the count and its relevant sample size from the facts.

Return no more than 450 words and exactly these four sections, in this order:

## Identity
Write 2-3 sentences.

## Exploitable Weaknesses
Write exactly 3 bullets. Each bullet must explicitly follow: Evidence → Insight → Recommendation.

## Dangers To Respect
Write exactly 2 bullets. Each bullet must explicitly follow: Evidence → Insight → Recommendation.

## Suggested Ban/Pick Considerations
Write exactly 2 map-pool-based bullets.

Do not add an introduction, conclusion, extra section, hedging filler, or uncited claims.

FACTS JSON:
${JSON.stringify(facts, null, 2)}`
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

  const teamId = typeof (body as { teamId?: unknown })?.teamId === 'string'
    ? (body as { teamId: string }).teamId.trim()
    : ''

  if (!teamId) {
    return NextResponse.json({ message: 'teamId is required.' }, { status: 400 })
  }

  try {
    await connectToDB()
    const series = await getTeamSeriesDerived(teamId)

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
    const factsUsed = buildFacts(tendencies, pistolPercentile, antiEcoPercentile)
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
