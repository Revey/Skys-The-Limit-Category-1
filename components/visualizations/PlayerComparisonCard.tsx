import type { PlayerCardStat } from '@/lib/analytics/computePlayerCards'

interface PlayerComparisonCardProps {
  player: PlayerCardStat
  teamName: string
  isFocusTeam: boolean
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-black/20 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-100">{value}</p>
    </div>
  )
}

export default function PlayerComparisonCard({
  player,
  teamName,
  isFocusTeam,
}: PlayerComparisonCardProps) {
  return (
    <article className={`rounded-xl border p-5 ${
      isFocusTeam
        ? 'border-blue-500/40 bg-blue-950/20'
        : 'border-gray-700 bg-gray-900/50'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{player.playerName}</h4>
          <p className="text-sm text-gray-400">{teamName}</p>
        </div>
        {isFocusTeam && (
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
            Focus
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {player.kills !== undefined && <StatTile label="Kills" value={player.kills} />}
        {player.deaths !== undefined && <StatTile label="Deaths" value={player.deaths} />}
        {player.kd !== undefined && <StatTile label="K/D" value={player.kd.toFixed(2)} />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {player.adr !== undefined && (
          <StatTile label="ADR" value={player.adr.toFixed(1)} />
        )}
        {player.damagePerKill !== undefined && (
          <StatTile label="Dmg/Kill" value={player.damagePerKill.toFixed(1)} />
        )}
        {player.firstBloods !== undefined && (
          <StatTile label="First Bloods" value={player.firstBloods} />
        )}
        {player.firstDeaths !== undefined && (
          <StatTile label="First Deaths" value={player.firstDeaths} />
        )}
        {player.isolatedDeathsCount !== undefined && (
          <StatTile label="Isolated Deaths" value={player.isolatedDeathsCount} />
        )}
        {player.clutchWins !== undefined && player.clutchAttempts !== undefined && (
          <StatTile
            label="Clutches Won / Tried"
            value={`${player.clutchWins} / ${player.clutchAttempts}`}
          />
        )}
        {player.multiKillCount !== undefined && (
          <StatTile label="Multi-kill Rounds" value={player.multiKillCount} />
        )}
      </div>
    </article>
  )
}
