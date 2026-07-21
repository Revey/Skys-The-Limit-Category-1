import type { EvidenceV1 } from '@/lib/types/evidence'

export type IndicatorTone = 'accent' | 'good' | 'bad'

export interface GlanceIndicator {
  key: 'opening-duels' | 'post-plant' | 'anti-eco' | 'isolated-deaths'
  label: string
  value: string
  sample: string
  tone: IndicatorTone
}

export interface RoundToReview {
  gameId: string
  roundNumber: number
  reason: string
}

function roundKey(gameId: string, roundNumber: number): string {
  return `${gameId}:${roundNumber}`
}

function isScoped(gameId: string, selectedGameId?: string): boolean {
  return !selectedGameId || gameId === selectedGameId
}

function criticalRoundReason(reason?: string): string {
  const trimmed = reason?.trim()
  if (!trimmed || /^score within \d+ rounds\b/i.test(trimmed) || /^competitive score$/i.test(trimmed)) {
    return 'Critical round'
  }
  return trimmed
}

function percentage(wins: number, attempts: number): string {
  return `${Math.round((wins / attempts) * 100)}%`
}

export function computeGlanceIndicators(
  evidence: EvidenceV1,
  focusTeamId: string,
  selectedGameId?: string
): GlanceIndicator[] {
  const rounds = evidence.rounds.filter(round => isScoped(round.gameId, selectedGameId))
  const kills = evidence.kills.filter(kill => isScoped(kill.gameId, selectedGameId))
  const plants = evidence.plants.filter(plant => isScoped(plant.gameId, selectedGameId))
  const economyRounds = (evidence.economyRounds || []).filter(round =>
    isScoped(round.gameId, selectedGameId)
  )
  const playerTeam = new Map(evidence.players.map(player => [player.playerId, player.teamId]))
  const roundByKey = new Map(rounds.map(round => [roundKey(round.gameId, round.roundNumber), round]))
  const firstBloodKillByRound = new Map(
    kills
      .filter(kill => kill.isFirstBlood)
      .map(kill => [roundKey(kill.gameId, kill.roundNumber), kill])
  )
  const indicators: GlanceIndicator[] = []

  let openingKills = 0
  let openingDeaths = 0
  for (const round of rounds) {
    const firstBlood = round.firstBlood
    if (!firstBlood) continue

    const firstBloodKill = firstBloodKillByRound.get(roundKey(round.gameId, round.roundNumber))
    const killerTeamId = firstBlood.killerTeamId || firstBloodKill?.killerTeamId
    const victimTeamId =
      firstBloodKill?.victimTeamId || playerTeam.get(firstBlood.victimId)

    if (killerTeamId === focusTeamId) openingKills++
    if (victimTeamId === focusTeamId) openingDeaths++
  }

  const openingDuels = openingKills + openingDeaths
  if (openingDuels > 0) {
    const rate = openingKills / openingDuels
    indicators.push({
      key: 'opening-duels',
      label: 'Opening duels',
      value: percentage(openingKills, openingDuels),
      sample: `(${openingKills}/${openingDuels}) opening duels won`,
      tone: rate >= 0.5 ? 'good' : 'bad',
    })
  }

  let postPlantWins = 0
  let postPlantRounds = 0
  for (const plant of plants) {
    if (plant.planterTeamId !== focusTeamId) continue
    const round = roundByKey.get(roundKey(plant.gameId, plant.roundNumber))
    if (!round?.winnerTeamId) continue

    postPlantRounds++
    if (round.winnerTeamId === focusTeamId) postPlantWins++
  }

  if (postPlantRounds > 0) {
    const rate = postPlantWins / postPlantRounds
    indicators.push({
      key: 'post-plant',
      label: 'Post-plant conversion',
      value: percentage(postPlantWins, postPlantRounds),
      sample: `(${postPlantWins}/${postPlantRounds}) post-plants won`,
      tone: rate >= 0.5 ? 'good' : 'bad',
    })
  }

  const economyByRound = new Map<string, typeof economyRounds>()
  for (const economyRound of economyRounds) {
    const key = roundKey(economyRound.gameId, economyRound.roundNumber)
    const entries = economyByRound.get(key) || []
    entries.push(economyRound)
    economyByRound.set(key, entries)
  }

  let antiEcoWins = 0
  let antiEcoRounds = 0
  for (const [key, entries] of economyByRound) {
    const focusEconomy = entries.find(entry => entry.teamId === focusTeamId)
    const opponentOnLowBuy = entries.some(
      entry =>
        entry.teamId !== focusTeamId &&
        (entry.economyTier === 'eco' || entry.economyTier === 'save')
    )
    const focusHasBuyAdvantage =
      focusEconomy?.economyTier === 'full_buy' || focusEconomy?.economyTier === 'half_buy'

    if (!focusEconomy || !focusHasBuyAdvantage || !opponentOnLowBuy) continue

    const winnerTeamId = roundByKey.get(key)?.winnerTeamId
    const won =
      typeof focusEconomy.roundWon === 'boolean'
        ? focusEconomy.roundWon
        : winnerTeamId
          ? winnerTeamId === focusTeamId
          : undefined
    if (typeof won !== 'boolean') continue

    antiEcoRounds++
    if (won) antiEcoWins++
  }

  if (antiEcoRounds > 0) {
    const rate = antiEcoWins / antiEcoRounds
    const failures = antiEcoRounds - antiEcoWins
    indicators.push({
      key: 'anti-eco',
      label: 'Anti-eco discipline',
      value: percentage(antiEcoWins, antiEcoRounds),
      sample: `(${antiEcoWins}/${antiEcoRounds}) won${failures > 0 ? ` · ${failures} lost` : ''}`,
      tone: failures === 0 ? 'good' : 'bad',
    })
  }

  const focusDeaths = kills.filter(kill => {
    const victimTeamId = kill.victimTeamId || playerTeam.get(kill.victimId)
    return victimTeamId === focusTeamId
  })
  const isolationDataComplete =
    focusDeaths.length > 0 && focusDeaths.every(kill => typeof kill.isIsolated === 'boolean')

  if (isolationDataComplete) {
    const isolatedDeaths = focusDeaths.filter(kill => kill.isIsolated).length
    indicators.push({
      key: 'isolated-deaths',
      label: 'Isolated / untraded deaths',
      value: String(isolatedDeaths),
      sample: `across ${focusDeaths.length} team deaths`,
      tone: isolatedDeaths === 0 ? 'good' : 'bad',
    })
  }

  return indicators.slice(0, 4)
}

export function computeRoundsToReview(
  evidence: EvidenceV1,
  focusTeamId: string,
  selectedGameId?: string
): RoundToReview[] {
  const selected: RoundToReview[] = []
  const selectedKeys = new Set<string>()
  const roundWinnerByKey = new Map(
    evidence.rounds
      .filter(round => isScoped(round.gameId, selectedGameId))
      .map(round => [roundKey(round.gameId, round.roundNumber), round.winnerTeamId])
  )

  const addRound = (round: RoundToReview) => {
    const key = roundKey(round.gameId, round.roundNumber)
    if (selectedKeys.has(key) || selected.length >= 5) return
    selectedKeys.add(key)
    selected.push(round)
  }

  for (const game of evidence.derived?.criticalRounds || []) {
    if (!isScoped(game.gameId, selectedGameId)) continue
    for (const round of game.topReviewRounds || []) {
      addRound({
        gameId: game.gameId,
        roundNumber: round.roundNumber,
        reason: criticalRoundReason(round.reason),
      })
    }
  }

  if (selected.length >= 3) return selected

  const fallback: Array<RoundToReview & { priority: number }> = []
  for (const clutch of evidence.clutchSituations || []) {
    if (!isScoped(clutch.gameId, selectedGameId)) continue
    const focusLostClutch =
      (clutch.teamId === focusTeamId && clutch.won === false) ||
      (clutch.teamId !== focusTeamId && clutch.won === true)
    if (!focusLostClutch) continue

    fallback.push({
      gameId: clutch.gameId,
      roundNumber: clutch.roundNumber,
      reason: `Lost ${clutch.situation || 'clutch'}`,
      priority: 2,
    })
  }

  const scopedEconomy = (evidence.economyRounds || []).filter(round =>
    isScoped(round.gameId, selectedGameId)
  )
  const economyByRound = new Map<string, typeof scopedEconomy>()
  for (const economyRound of scopedEconomy) {
    const key = roundKey(economyRound.gameId, economyRound.roundNumber)
    const entries = economyByRound.get(key) || []
    entries.push(economyRound)
    economyByRound.set(key, entries)
  }

  for (const entries of economyByRound.values()) {
    const focusEconomy = entries.find(entry => entry.teamId === focusTeamId)
    const opponentOnLowBuy = entries.some(
      entry =>
        entry.teamId !== focusTeamId &&
        (entry.economyTier === 'eco' || entry.economyTier === 'save')
    )
    const focusHadBuy =
      focusEconomy?.economyTier === 'full_buy' || focusEconomy?.economyTier === 'half_buy'

    if (!focusEconomy || !focusHadBuy || !opponentOnLowBuy) {
      continue
    }

    const winnerTeamId = roundWinnerByKey.get(
      roundKey(focusEconomy.gameId, focusEconomy.roundNumber)
    )
    const focusWon =
      typeof focusEconomy.roundWon === 'boolean'
        ? focusEconomy.roundWon
        : winnerTeamId
          ? winnerTeamId === focusTeamId
          : undefined
    if (typeof focusWon !== 'boolean' || focusWon) continue

    fallback.push({
      gameId: focusEconomy.gameId,
      roundNumber: focusEconomy.roundNumber,
      reason: 'Anti-eco loss',
      priority: 3,
    })
  }

  fallback
    .sort((a, b) => b.priority - a.priority || a.roundNumber - b.roundNumber)
    .forEach(({ priority: _priority, ...round }) => {
      if (selected.length < 3) addRound(round)
    })

  return selected
}
