import type { EvidenceDerived } from '@/lib/types/evidence'

export interface SeriesDerivedInput {
  map?: string | null
  derived?: Partial<EvidenceDerived> | null
}

export interface RateMetric {
  numerator: number
  denominator: number
  rate: number
}

export interface AverageMetric {
  total: number
  denominator: number
  average: number
}

export interface MapPoolTendency {
  map: string
  seriesPlayed: number
  gamesPlayed: number
  gamesWon: number
  winRate: RateMetric
}

export interface EconomyTierTendency {
  rounds: number
  wins: number
  winRate: RateMetric
}

export interface TempoBucketTendency {
  rounds: number
  wins: number
  winRate: RateMetric
}

export interface SiteTendency {
  site: string
  attackPlants: number
  postPlantWins: number
  postPlantWinRate: RateMetric
  defenseAttempts: number
  defenseWins: number
  defenseWinRate: RateMetric
  preferenceShare: RateMetric
}

export interface EntryPlayerTendency {
  playerId: string
  playerName: string
  entryAttempts: number
  entryKills: number
  entryDeaths: number
  entrySuccessRate: RateMetric
  deathsTraded: number
  tradeRate: RateMetric
}

export interface CarrierPlayerTendency {
  playerId: string
  playerName: string
  roundsAsCarrier: number
  successfulPlants: number
  deathsBeforePlant: number
  plantRate: RateMetric
  carrierDeathRate: RateMetric
}

export interface TeamTendencies {
  teamId: string
  seriesCount: number
  mapPool: MapPoolTendency[]
  pistols: {
    overall: RateMetric
    attack: RateMetric
    defense: RateMetric
    bonusConversion: RateMetric
    lostToForce: RateMetric
    topFraggers: Array<{
      playerId: string
      playerName: string
      pistolKills: number
      pistolDeaths: number
    }>
  }
  economy: {
    byTier: Record<string, EconomyTierTendency>
    afterLoss: Record<string, EconomyTierTendency>
    afterLossForceRate: RateMetric
    forceAfterPistolLoss: RateMetric
    ecoUpsetWinRate: RateMetric
  }
  tempo: {
    avgTimeToPlant: AverageMetric
    latePlantRate: RateMetric
    earlyAggressionRate: RateMetric
    byTempo: Record<string, TempoBucketTendency>
  }
  sites: SiteTendency[]
  entryPlayers: EntryPlayerTendency[]
  spikeCarriers: {
    plantRate: RateMetric
    carrierDeathRate: RateMetric
    spikeDrops: number
    byPlayer: CarrierPlayerTendency[]
  }
  antiEco: {
    winRate: RateMetric
    deathsToEco: number
    deathsToForce: number
    problematicWeapons: Array<{ weapon: string; deaths: number }>
  }
}

type MutableCountBucket = { rounds: number; wins: number }

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.map(record).filter((item): item is Record<string, unknown> => item !== undefined)
    : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function numberFrom(source: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = finiteNumber(source?.[key])
    if (value !== undefined) return value
  }
  return undefined
}

function rateMetric(numerator: number, denominator: number): RateMetric {
  return {
    numerator,
    denominator,
    rate: denominator > 0 ? numerator / denominator : 0,
  }
}

function averageMetric(total: number, denominator: number): AverageMetric {
  return {
    total,
    denominator,
    average: denominator > 0 ? total / denominator : 0,
  }
}

function numeratorFromRate(rate: number | undefined, denominator: number): number {
  if (rate === undefined || denominator <= 0) return 0
  return Math.round(rate * denominator)
}

function addCountBucket(
  target: Map<string, MutableCountBucket>,
  source: unknown
): void {
  const sourceRecord = record(source)
  if (!sourceRecord) return

  for (const [key, rawBucket] of Object.entries(sourceRecord)) {
    const bucket = record(rawBucket)
    const rounds = finiteNumber(bucket?.rounds)
    const wins = finiteNumber(bucket?.wins)
    if (rounds === undefined || wins === undefined) continue

    const current = target.get(key) ?? { rounds: 0, wins: 0 }
    current.rounds += rounds
    current.wins += wins
    target.set(key, current)
  }
}

function finalizeCountBuckets(
  source: Map<string, MutableCountBucket>
): Record<string, EconomyTierTendency> {
  return Object.fromEntries(
    Array.from(source.entries()).map(([key, bucket]) => [
      key,
      {
        rounds: bucket.rounds,
        wins: bucket.wins,
        winRate: rateMetric(bucket.wins, bucket.rounds),
      },
    ])
  )
}

function teamRows(group: unknown, teamId: string): Array<Record<string, unknown>> {
  return records(group).filter(row => stringValue(row.teamId) === teamId)
}

/**
 * Aggregates Evidence V1 derived groups without mutating the inputs.
 *
 * Stored per-series rates are never averaged. Counts are summed first and every
 * aggregate rate is produced from the pooled numerator and denominator.
 */
export function aggregateTeamTendencies(
  seriesDerivedList: SeriesDerivedInput[],
  teamId: string
): TeamTendencies {
  const mapPool = new Map<string, {
    seriesPlayed: number
    gamesPlayed: number
    gamesWon: number
  }>()

  let pistolWon = 0
  let pistolPlayed = 0
  let attackPistolWon = 0
  let attackPistolPlayed = 0
  let defensePistolWon = 0
  let defensePistolPlayed = 0
  let bonusWon = 0
  let bonusPlayed = 0
  let lostToForce = 0
  const pistolFraggers = new Map<string, {
    playerId: string
    playerName: string
    pistolKills: number
    pistolDeaths: number
  }>()

  const economyByTier = new Map<string, MutableCountBucket>()
  const economyAfterLoss = new Map<string, MutableCountBucket>()
  let forceAfterPistolAttempts = 0
  let forceAfterPistolWins = 0

  let timeToPlantTotal = 0
  let timeToPlantSamples = 0
  let latePlants = 0
  let latePlantSamples = 0
  let earlyAggressions = 0
  let earlyAggressionSamples = 0
  const tempoBuckets = new Map<string, MutableCountBucket>()

  const sites = new Map<string, {
    attackPlants: number
    postPlantWins: number
    defenseAttempts: number
    defenseWins: number
  }>()

  const entryPlayers = new Map<string, {
    playerId: string
    playerName: string
    entryAttempts: number
    entryKills: number
    entryDeaths: number
    entrySuccesses: number
    deathsTraded: number
  }>()

  let totalAttackRounds = 0
  let successfulPlants = 0
  let carrierDeaths = 0
  let spikeDrops = 0
  const carriers = new Map<string, {
    playerId: string
    playerName: string
    roundsAsCarrier: number
    successfulPlants: number
    deathsBeforePlant: number
  }>()

  let antiEcoRounds = 0
  let antiEcoWins = 0
  let deathsToEco = 0
  let deathsToForce = 0
  const problematicWeapons = new Map<string, number>()

  let seriesCount = 0

  for (const series of seriesDerivedList) {
    const derived = record(series.derived)
    if (!derived) continue
    seriesCount++

    const mapsStats = records(derived.mapsStats)
    const seriesMaps = new Set<string>()
    for (const stat of mapsStats) {
      if (stringValue(stat.teamId) !== teamId) continue

      const gameId = stringValue(stat.gameId)
      const mapName = stringValue(stat.mapName) || stringValue(stat.map) || stringValue(series.map) || 'Unknown'
      const roundsWon = finiteNumber(stat.roundsWon) ?? 0
      const explicitRoundsLost = finiteNumber(stat.roundsLost)
      const opponentRounds = gameId
        ? mapsStats
          .filter(candidate => stringValue(candidate.gameId) === gameId && stringValue(candidate.teamId) !== teamId)
          .reduce((maximum, candidate) => Math.max(maximum, finiteNumber(candidate.roundsWon) ?? 0), 0)
        : 0
      const won = explicitRoundsLost !== undefined
        ? roundsWon > explicitRoundsLost
        : roundsWon > opponentRounds

      const aggregate = mapPool.get(mapName) ?? {
        seriesPlayed: 0,
        gamesPlayed: 0,
        gamesWon: 0,
      }
      aggregate.gamesPlayed++
      if (won) aggregate.gamesWon++
      mapPool.set(mapName, aggregate)
      seriesMaps.add(mapName)
    }
    for (const mapName of seriesMaps) {
      const aggregate = mapPool.get(mapName)
      if (aggregate) aggregate.seriesPlayed++
    }

    for (const pistol of teamRows(derived.pistolStats, teamId)) {
      const rounds = record(pistol.pistolRounds)
      const played = finiteNumber(rounds?.played) ?? 0
      const won = finiteNumber(rounds?.won) ?? 0
      pistolPlayed += played
      pistolWon += won

      const attackPlayed = numberFrom(rounds, ['attackPistolPlayed', 'attackPlayed']) ?? Math.round(played / 2)
      const defensePlayed = numberFrom(rounds, ['defensePistolPlayed', 'defensePlayed']) ?? Math.max(played - attackPlayed, 0)
      attackPistolPlayed += attackPlayed
      defensePistolPlayed += defensePlayed
      attackPistolWon += numberFrom(rounds, ['attackPistolWon', 'attackWon'])
        ?? numeratorFromRate(finiteNumber(rounds?.attackPistolWinRate), attackPlayed)
      defensePistolWon += numberFrom(rounds, ['defensePistolWon', 'defenseWon'])
        ?? numeratorFromRate(finiteNumber(rounds?.defensePistolWinRate), defensePlayed)

      const bonus = record(pistol.bonusConversion)
      const playedBonus = finiteNumber(bonus?.bonusRoundsPlayed) ?? 0
      bonusPlayed += playedBonus
      bonusWon += finiteNumber(bonus?.bonusRoundsWon) ?? 0
      lostToForce += numberFrom(bonus, ['lostToForce', 'lostToForceRounds'])
        ?? numeratorFromRate(finiteNumber(bonus?.lostToForceRate), playedBonus)

      const fragger = record(pistol.pistolTopFragger)
      const playerId = stringValue(fragger?.playerId)
      if (playerId) {
        const current = pistolFraggers.get(playerId) ?? {
          playerId,
          playerName: stringValue(fragger?.playerName) || `Player ${playerId}`,
          pistolKills: 0,
          pistolDeaths: 0,
        }
        current.playerName = stringValue(fragger?.playerName) || current.playerName
        current.pistolKills += finiteNumber(fragger?.pistolKills) ?? 0
        current.pistolDeaths += finiteNumber(fragger?.pistolDeaths) ?? 0
        pistolFraggers.set(playerId, current)
      }
    }

    for (const economy of teamRows(derived.economyStats, teamId)) {
      addCountBucket(economyByTier, economy.byTier)
      addCountBucket(economyAfterLoss, economy.afterLoss)

      const force = record(economy.forceAfterPistolLoss)
      forceAfterPistolAttempts += finiteNumber(force?.attempts) ?? 0
      forceAfterPistolWins += finiteNumber(force?.wins) ?? 0
    }

    let plantsInSeries = 0
    for (const site of records(derived.siteStats)) {
      const siteName = stringValue(site.site)
      if (!siteName) continue

      const attack = record(record(site.attackStats)?.[teamId])
      const defense = record(record(site.defenseStats)?.[teamId])
      if (!attack && !defense) continue

      const aggregate = sites.get(siteName) ?? {
        attackPlants: 0,
        postPlantWins: 0,
        defenseAttempts: 0,
        defenseWins: 0,
      }
      const plants = finiteNumber(attack?.plants) ?? 0
      aggregate.attackPlants += plants
      aggregate.postPlantWins += finiteNumber(attack?.postPlantWins) ?? 0
      aggregate.defenseAttempts += finiteNumber(defense?.defenseAttempts) ?? 0
      aggregate.defenseWins += finiteNumber(defense?.defenseWins) ?? 0
      sites.set(siteName, aggregate)
      plantsInSeries += plants
    }

    for (const tempo of teamRows(derived.tempoStats, teamId)) {
      const attack = record(tempo.attackStats)
      const defense = record(tempo.defenseStats)
      const seriesTempoBuckets = new Map<string, MutableCountBucket>()
      addCountBucket(seriesTempoBuckets, tempo.byTempo)
      addCountBucket(tempoBuckets, tempo.byTempo)
      const timedRounds = Array.from(seriesTempoBuckets.values())
        .reduce((sum, bucket) => sum + bucket.rounds, 0)

      const plantSamples = numberFrom(attack, [
        'plantSamples',
        'plantCount',
        'plants',
        'roundsWithPlant',
      ]) ?? (plantsInSeries > 0 ? plantsInSeries : Math.round(timedRounds / 2))
      const avgTime = finiteNumber(attack?.avgTimeToPlant)
      if (avgTime !== undefined && plantSamples > 0) {
        timeToPlantTotal += numberFrom(attack, ['totalTimeToPlant']) ?? avgTime * plantSamples
        timeToPlantSamples += plantSamples
      }

      const lateSamples = numberFrom(attack, ['latePlantSamples']) ?? plantSamples
      latePlantSamples += lateSamples
      latePlants += numberFrom(attack, ['latePlants'])
        ?? numeratorFromRate(finiteNumber(attack?.latePlantRate), lateSamples)

      const defenseSamples = numberFrom(defense, [
        'earlyAggressionSamples',
        'firstKillSamples',
        'rounds',
      ]) ?? Math.round(timedRounds / 2)
      earlyAggressionSamples += defenseSamples
      earlyAggressions += numberFrom(defense, ['earlyAggressions', 'earlyAggression'])
        ?? numeratorFromRate(finiteNumber(defense?.earlyAggressionRate), defenseSamples)
    }

    for (const entry of teamRows(derived.entryStats, teamId)) {
      const playerId = stringValue(entry.playerId)
      if (!playerId) continue
      const attempts = finiteNumber(entry.entryAttempts) ?? 0
      const kills = finiteNumber(entry.entryKills) ?? 0
      const deaths = finiteNumber(entry.entryDeaths) ?? 0
      const current = entryPlayers.get(playerId) ?? {
        playerId,
        playerName: stringValue(entry.playerName) || `Player ${playerId}`,
        entryAttempts: 0,
        entryKills: 0,
        entryDeaths: 0,
        entrySuccesses: 0,
        deathsTraded: 0,
      }
      current.playerName = stringValue(entry.playerName) || current.playerName
      current.entryAttempts += attempts
      current.entryKills += kills
      current.entryDeaths += deaths
      current.entrySuccesses += (kills + Math.max(attempts - deaths, 0)) / 2
      current.deathsTraded += finiteNumber(entry.deathsTraded) ?? 0
      entryPlayers.set(playerId, current)
    }

    for (const spike of teamRows(derived.spikeCarrierStats, teamId)) {
      totalAttackRounds += finiteNumber(spike.totalAttackRounds) ?? 0
      successfulPlants += finiteNumber(spike.successfulPlants) ?? 0
      carrierDeaths += finiteNumber(spike.carrierDeathsBeforePlant) ?? 0
      spikeDrops += finiteNumber(spike.spikeDrops) ?? 0

      const byPlayer = record(spike.byPlayer)
      if (!byPlayer) continue
      for (const [fallbackPlayerId, rawPlayer] of Object.entries(byPlayer)) {
        const player = record(rawPlayer)
        if (!player) continue
        const playerId = stringValue(player.playerId) || fallbackPlayerId
        const current = carriers.get(playerId) ?? {
          playerId,
          playerName: stringValue(player.playerName) || `Player ${playerId}`,
          roundsAsCarrier: 0,
          successfulPlants: 0,
          deathsBeforePlant: 0,
        }
        current.playerName = stringValue(player.playerName) || current.playerName
        current.roundsAsCarrier += finiteNumber(player.roundsAsCarrier) ?? 0
        current.successfulPlants += finiteNumber(player.successfulPlants) ?? 0
        current.deathsBeforePlant += finiteNumber(player.deathsBeforePlant) ?? 0
        carriers.set(playerId, current)
      }
    }

    for (const antiEco of teamRows(derived.antiEcoStats, teamId)) {
      antiEcoRounds += finiteNumber(antiEco.antiEcoRounds) ?? 0
      antiEcoWins += finiteNumber(antiEco.antiEcoWins) ?? 0
      deathsToEco += finiteNumber(antiEco.deathsToEco) ?? 0
      deathsToForce += finiteNumber(antiEco.deathsToForce) ?? 0

      for (const weapon of records(antiEco.problematicWeapons)) {
        const weaponName = stringValue(weapon.weapon)
        if (!weaponName) continue
        problematicWeapons.set(
          weaponName,
          (problematicWeapons.get(weaponName) ?? 0) + (finiteNumber(weapon.deaths) ?? 0)
        )
      }
    }
  }

  const finalizedEconomy = finalizeCountBuckets(economyByTier)
  const finalizedAfterLoss = finalizeCountBuckets(economyAfterLoss)
  const afterLossRounds = Array.from(economyAfterLoss.values())
    .reduce((sum, bucket) => sum + bucket.rounds, 0)
  const afterLossForceRounds = economyAfterLoss.get('half_buy')?.rounds ?? 0
  const ecoRounds = (economyByTier.get('eco')?.rounds ?? 0) + (economyByTier.get('save')?.rounds ?? 0)
  const ecoWins = (economyByTier.get('eco')?.wins ?? 0) + (economyByTier.get('save')?.wins ?? 0)
  const totalSitePlants = Array.from(sites.values())
    .reduce((sum, site) => sum + site.attackPlants, 0)

  return {
    teamId,
    seriesCount,
    mapPool: Array.from(mapPool.entries())
      .map(([map, stats]) => ({
        map,
        ...stats,
        winRate: rateMetric(stats.gamesWon, stats.gamesPlayed),
      }))
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed || a.map.localeCompare(b.map)),
    pistols: {
      overall: rateMetric(pistolWon, pistolPlayed),
      attack: rateMetric(attackPistolWon, attackPistolPlayed),
      defense: rateMetric(defensePistolWon, defensePistolPlayed),
      bonusConversion: rateMetric(bonusWon, bonusPlayed),
      lostToForce: rateMetric(lostToForce, bonusPlayed),
      topFraggers: Array.from(pistolFraggers.values())
        .sort((a, b) => b.pistolKills - a.pistolKills || a.playerName.localeCompare(b.playerName))
        .slice(0, 5),
    },
    economy: {
      byTier: finalizedEconomy,
      afterLoss: finalizedAfterLoss,
      afterLossForceRate: rateMetric(afterLossForceRounds, afterLossRounds),
      forceAfterPistolLoss: rateMetric(forceAfterPistolWins, forceAfterPistolAttempts),
      ecoUpsetWinRate: rateMetric(ecoWins, ecoRounds),
    },
    tempo: {
      avgTimeToPlant: averageMetric(timeToPlantTotal, timeToPlantSamples),
      latePlantRate: rateMetric(latePlants, latePlantSamples),
      earlyAggressionRate: rateMetric(earlyAggressions, earlyAggressionSamples),
      byTempo: finalizeCountBuckets(tempoBuckets),
    },
    sites: Array.from(sites.entries())
      .map(([site, stats]) => ({
        site,
        ...stats,
        postPlantWinRate: rateMetric(stats.postPlantWins, stats.attackPlants),
        defenseWinRate: rateMetric(stats.defenseWins, stats.defenseAttempts),
        preferenceShare: rateMetric(stats.attackPlants, totalSitePlants),
      }))
      .sort((a, b) => b.attackPlants - a.attackPlants || a.site.localeCompare(b.site)),
    entryPlayers: Array.from(entryPlayers.values())
      .map(player => ({
        ...player,
        entrySuccessRate: rateMetric(player.entrySuccesses, player.entryAttempts),
        tradeRate: rateMetric(player.deathsTraded, player.entryDeaths),
      }))
      .sort((a, b) => b.entryAttempts - a.entryAttempts || a.playerName.localeCompare(b.playerName))
      .slice(0, 5),
    spikeCarriers: {
      plantRate: rateMetric(successfulPlants, totalAttackRounds),
      carrierDeathRate: rateMetric(carrierDeaths, totalAttackRounds),
      spikeDrops,
      byPlayer: Array.from(carriers.values())
        .map(player => ({
          ...player,
          plantRate: rateMetric(player.successfulPlants, player.roundsAsCarrier),
          carrierDeathRate: rateMetric(player.deathsBeforePlant, player.roundsAsCarrier),
        }))
        .sort((a, b) => b.roundsAsCarrier - a.roundsAsCarrier || a.playerName.localeCompare(b.playerName))
        .slice(0, 5),
    },
    antiEco: {
      winRate: rateMetric(antiEcoWins, antiEcoRounds),
      deathsToEco,
      deathsToForce,
      problematicWeapons: Array.from(problematicWeapons.entries())
        .map(([weapon, deaths]) => ({ weapon, deaths }))
        .sort((a, b) => b.deaths - a.deaths || a.weapon.localeCompare(b.weapon))
        .slice(0, 3),
    },
  }
}
