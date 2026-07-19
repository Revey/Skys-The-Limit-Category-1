import type { ReactNode } from 'react'
import type {
  AverageMetric,
  RateMetric,
  TeamTendencies,
} from '@/lib/analytics/aggregateTeamTendencies'

interface TendencyMatrixProps {
  teamName: string
  tendencies: TeamTendencies
}

const LOW_SAMPLE_THRESHOLD = 8
const TIER_ORDER = ['save', 'eco', 'half_buy', 'full_buy']
const TEMPO_ORDER = ['fast', 'standard', 'slow']

function label(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function sampleSize(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function RateValue({ metric }: { metric: RateMetric }) {
  const lowSample = metric.denominator < LOW_SAMPLE_THRESHOLD
  return (
    <span className={lowSample ? 'text-gray-500' : 'text-gray-100'}>
      {(metric.rate * 100).toFixed(0)}% (n={sampleSize(metric.denominator)})
      {lowSample && <span className="ml-1 text-[10px] uppercase tracking-wide">low sample</span>}
    </span>
  )
}

function AverageValue({ metric, suffix }: { metric: AverageMetric; suffix: string }) {
  const lowSample = metric.denominator < LOW_SAMPLE_THRESHOLD
  return (
    <span className={lowSample ? 'text-gray-500' : 'text-gray-100'}>
      {metric.average.toFixed(1)}{suffix} (n={sampleSize(metric.denominator)})
      {lowSample && <span className="ml-1 text-[10px] uppercase tracking-wide">low sample</span>}
    </span>
  )
}

function MatrixCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="card p-5 min-w-0">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </article>
  )
}

function MetricRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-800/70 last:border-0">
      <span className="text-sm text-gray-400">{name}</span>
      <span className="text-sm text-right font-medium">{children}</span>
    </div>
  )
}

function EmptyState() {
  return <p className="text-sm text-gray-500 italic">No derived archive data available.</p>
}

export function TendencyMatrix({ teamName, tendencies }: TendencyMatrixProps) {
  const economyTiers = TIER_ORDER.filter(tier => tendencies.economy.byTier[tier])
  const extraEconomyTiers = Object.keys(tendencies.economy.byTier)
    .filter(tier => !TIER_ORDER.includes(tier))
    .sort()
  const tempoTiers = TEMPO_ORDER.filter(tempo => tendencies.tempo.byTempo[tempo])
  const extraTempoTiers = Object.keys(tendencies.tempo.byTempo)
    .filter(tempo => !TEMPO_ORDER.includes(tempo))
    .sort()

  return (
    <section aria-labelledby="tendency-matrix-title" className="space-y-4">
      <div>
        <h2 id="tendency-matrix-title" className="text-2xl font-semibold text-white">
          {teamName} Tendency Matrix
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          All 2024–25 archive data • {tendencies.seriesCount} series analyzed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <MatrixCard title="Map Pool">
          {tendencies.mapPool.length === 0 ? <EmptyState /> : (
            <div className="space-y-3">
              {tendencies.mapPool.map(map => (
                <div key={map.map}>
                  <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                    <span className="text-gray-200 capitalize">{map.map}</span>
                    <RateValue metric={map.winRate} />
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00aeef]"
                      style={{ width: `${Math.max(map.winRate.rate * 100, 2)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {map.seriesPlayed} series • {map.gamesWon}/{map.gamesPlayed} maps
                  </p>
                </div>
              ))}
            </div>
          )}
        </MatrixCard>

        <MatrixCard title="Pistols & Bonus">
          {tendencies.pistols.overall.denominator === 0 ? <EmptyState /> : (
            <>
              <MetricRow name="Pistol WR"><RateValue metric={tendencies.pistols.overall} /></MetricRow>
              <MetricRow name="Attack pistol WR"><RateValue metric={tendencies.pistols.attack} /></MetricRow>
              <MetricRow name="Defense pistol WR"><RateValue metric={tendencies.pistols.defense} /></MetricRow>
              <MetricRow name="Bonus conversion"><RateValue metric={tendencies.pistols.bonusConversion} /></MetricRow>
              <MetricRow name="Lost to force"><RateValue metric={tendencies.pistols.lostToForce} /></MetricRow>
              {tendencies.pistols.topFraggers.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Top pistol fraggers</p>
                  {tendencies.pistols.topFraggers.map(player => (
                    <div key={player.playerId} className="flex justify-between gap-3 text-sm py-1">
                      <span className="text-gray-300 truncate">{player.playerName}</span>
                      <span className="text-gray-400">{player.pistolKills}K / {player.pistolDeaths}D</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </MatrixCard>

        <MatrixCard title="Economy Discipline">
          {economyTiers.length + extraEconomyTiers.length === 0 ? <EmptyState /> : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs text-gray-500 pb-2 border-b border-gray-800">
                <span>Tier</span><span>Record</span><span>Win rate</span>
              </div>
              {[...economyTiers, ...extraEconomyTiers].map(tier => {
                const stats = tendencies.economy.byTier[tier]
                return (
                  <div key={tier} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 py-2 border-b border-gray-800/70 last:border-0 text-sm">
                    <span className="text-gray-300">{label(tier)}</span>
                    <span className="text-gray-500">{stats.wins}-{stats.rounds - stats.wins}</span>
                    <RateValue metric={stats.winRate} />
                  </div>
                )
              })}
              <div className="mt-2">
                <MetricRow name="After-loss force rate">
                  <RateValue metric={tendencies.economy.afterLossForceRate} />
                </MetricRow>
              </div>
            </>
          )}
        </MatrixCard>

        <MatrixCard title="Tempo Profile">
          {tempoTiers.length + extraTempoTiers.length === 0 && tendencies.tempo.avgTimeToPlant.denominator === 0
            ? <EmptyState />
            : (
              <>
                <MetricRow name="Avg. time to plant">
                  <AverageValue metric={tendencies.tempo.avgTimeToPlant} suffix="s" />
                </MetricRow>
                <MetricRow name="Late plant rate"><RateValue metric={tendencies.tempo.latePlantRate} /></MetricRow>
                <MetricRow name="Early aggression"><RateValue metric={tendencies.tempo.earlyAggressionRate} /></MetricRow>
                <div className="mt-3">
                  {[...tempoTiers, ...extraTempoTiers].map(tempo => (
                    <MetricRow key={tempo} name={`${label(tempo)} WR`}>
                      <RateValue metric={tendencies.tempo.byTempo[tempo].winRate} />
                    </MetricRow>
                  ))}
                </div>
              </>
            )}
        </MatrixCard>

        <MatrixCard title="Site Preference">
          {tendencies.sites.length === 0 ? <EmptyState /> : (
            <div className="space-y-4">
              {tendencies.sites.map(site => (
                <div key={site.site} className="rounded-lg bg-black/20 p-3">
                  <div className="flex justify-between gap-3 mb-2">
                    <span className="font-semibold text-gray-200">Site {site.site.toUpperCase()}</span>
                    <span className="text-sm"><RateValue metric={site.preferenceShare} /></span>
                  </div>
                  <MetricRow name="Post-plant WR"><RateValue metric={site.postPlantWinRate} /></MetricRow>
                  <MetricRow name="Defense WR"><RateValue metric={site.defenseWinRate} /></MetricRow>
                </div>
              ))}
            </div>
          )}
        </MatrixCard>

        <MatrixCard title="Entry Players">
          {tendencies.entryPlayers.length === 0 ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left pb-2 font-medium">Player</th>
                    <th className="text-right pb-2 font-medium">Duels</th>
                    <th className="text-right pb-2 font-medium">Success</th>
                    <th className="text-right pb-2 font-medium">Traded</th>
                  </tr>
                </thead>
                <tbody>
                  {tendencies.entryPlayers.map(player => (
                    <tr key={player.playerId} className="border-b border-gray-800/70 last:border-0">
                      <td className="py-2 text-gray-300">{player.playerName}</td>
                      <td className="py-2 text-right text-gray-500">{player.entryKills}K/{player.entryDeaths}D</td>
                      <td className="py-2 text-right"><RateValue metric={player.entrySuccessRate} /></td>
                      <td className="py-2 text-right"><RateValue metric={player.tradeRate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MatrixCard>

        <MatrixCard title="Spike Carriers">
          {tendencies.spikeCarriers.plantRate.denominator === 0 ? <EmptyState /> : (
            <>
              <MetricRow name="Plant rate"><RateValue metric={tendencies.spikeCarriers.plantRate} /></MetricRow>
              <MetricRow name="Carrier death rate"><RateValue metric={tendencies.spikeCarriers.carrierDeathRate} /></MetricRow>
              <MetricRow name="Spike drops">{tendencies.spikeCarriers.spikeDrops}</MetricRow>
              {tendencies.spikeCarriers.byPlayer.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Primary carriers</p>
                  {tendencies.spikeCarriers.byPlayer.map(player => (
                    <div key={player.playerId} className="flex justify-between gap-3 py-1.5 text-sm">
                      <span className="text-gray-300 truncate">{player.playerName}</span>
                      <RateValue metric={player.plantRate} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </MatrixCard>

        <MatrixCard title="Anti-Eco">
          {tendencies.antiEco.winRate.denominator === 0 ? <EmptyState /> : (
            <>
              <MetricRow name="Anti-eco WR"><RateValue metric={tendencies.antiEco.winRate} /></MetricRow>
              <MetricRow name="Deaths to eco">{tendencies.antiEco.deathsToEco}</MetricRow>
              <MetricRow name="Deaths to force">{tendencies.antiEco.deathsToForce}</MetricRow>
              {tendencies.antiEco.problematicWeapons.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Problematic weapons</p>
                  {tendencies.antiEco.problematicWeapons.map(weapon => (
                    <div key={weapon.weapon} className="flex justify-between gap-3 py-1 text-sm">
                      <span className="text-gray-300 capitalize">{weapon.weapon}</span>
                      <span className="text-red-300">{weapon.deaths} deaths</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </MatrixCard>
      </div>
    </section>
  )
}
