import type { RateMetric, TeamTendencies } from '@/lib/analytics/aggregateTeamTendencies'

interface RoundTypeScorecardProps {
  teamName: string
  tendencies: TeamTendencies
}

const LOW_SAMPLE_THRESHOLD = 8

function ScoreTile({ title, metric }: { title: string; metric: RateMetric }) {
  const lowSample = metric.denominator < LOW_SAMPLE_THRESHOLD
  return (
    <div className={`rounded-xl border border-gray-800 bg-black/20 p-4 ${lowSample ? 'opacity-50' : ''}`}>
      <p className="text-sm text-gray-400 mb-2">{title}</p>
      <p className="text-2xl font-bold text-white">{(metric.rate * 100).toFixed(0)}%</p>
      <p className="text-xs text-gray-500 mt-1">
        n={metric.denominator}
        {lowSample && <span className="ml-1 uppercase tracking-wide">• low sample</span>}
      </p>
    </div>
  )
}

export function RoundTypeScorecard({ teamName, tendencies }: RoundTypeScorecardProps) {
  const fullBuy = tendencies.economy.byTier.full_buy?.winRate ?? {
    numerator: 0,
    denominator: 0,
    rate: 0,
  }
  const fast = tendencies.tempo.byTempo.fast?.winRate ?? {
    numerator: 0,
    denominator: 0,
    rate: 0,
  }
  const slow = tendencies.tempo.byTempo.slow?.winRate ?? {
    numerator: 0,
    denominator: 0,
    rate: 0,
  }

  return (
    <section className="card p-6 mb-8 animate-fade-in-up" aria-labelledby="round-type-scorecard-title">
      <div className="mb-5">
        <h2 id="round-type-scorecard-title" className="text-xl font-semibold text-white">
          Round-Type Scorecard
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {teamName} • All 2024–25 archive data • {tendencies.seriesCount} series
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreTile title="Pistol WR" metric={tendencies.pistols.overall} />
        <ScoreTile title="Bonus Conversion" metric={tendencies.pistols.bonusConversion} />
        <ScoreTile title="Anti-Eco WR" metric={tendencies.antiEco.winRate} />
        <ScoreTile title="Eco / Upset WR" metric={tendencies.economy.ecoUpsetWinRate} />
        <ScoreTile title="Full-Buy WR" metric={fullBuy} />
        <ScoreTile title="After-Loss Force" metric={tendencies.economy.afterLossForceRate} />
        <ScoreTile title="Fast Tempo WR" metric={fast} />
        <ScoreTile title="Slow Tempo WR" metric={slow} />
      </div>
    </section>
  )
}
