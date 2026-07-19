import type {
  ClutchSituation,
  EconomyRound,
  GameInfo,
  ManAdvantageStat,
  MapStat,
  RoundInfo,
  CriticalRoundStat,
} from '@/lib/types/evidence'
import { normalizeTeamName } from '@/lib/teamUtils'

export type ReviewCategory =
  | 'throw'
  | 'lost_anti_eco'
  | 'opponent_clutch'
  | 'lost_post_plant'
  | 'critical_round'

export type ReviewSeverity = 2 | 3 | 4 | 5

interface ReviewPlant {
  gameId: string
  roundNumber: number
  teamId?: string
}

export interface ReviewEvidence {
  games?: Array<Pick<GameInfo, 'gameId' | 'mapName'>>
  rounds?: Array<Pick<RoundInfo, 'gameId' | 'roundNumber' | 'winnerTeamId' | 'winnerSide' | 'hadPlant' | 'firstBlood'>>
  plants?: ReviewPlant[]
  clutchSituations?: Array<Pick<ClutchSituation, 'gameId' | 'roundNumber' | 'playerName' | 'teamId' | 'situation' | 'won'>>
  economyRounds?: Array<Pick<EconomyRound, 'gameId' | 'roundNumber' | 'teamId' | 'economyTier' | 'roundWon'>>
  derived?: {
    mapsStats?: Array<Pick<MapStat, 'teamId' | 'teamName'>>
    manAdvantageStats?: Array<Pick<ManAdvantageStat, 'teamId' | 'throwStats'>>
    criticalRounds?: Array<Pick<CriticalRoundStat, 'gameId' | 'topReviewRounds'>>
  }
}

export interface ReviewSeriesInput {
  matchId: string
  gridSeriesId: string
  /** Legacy match metadata is accepted for compatibility but never used by the queue. */
  opponentName?: string
  date?: Date | string
  map?: string
  evidence: ReviewEvidence
}

export interface ReviewItem {
  matchId: string
  gridSeriesId: string
  opponentName: string
  date?: string
  gameId: string
  mapName: string
  roundNumber: number
  category: ReviewCategory
  severity: ReviewSeverity
  reason: string
  detail: string
}

type ReviewCandidate = Omit<ReviewItem, 'detail'> & { detail?: string }

function reviewKey(matchId: string, gameId: string, roundNumber: number): string {
  return `${matchId}:${gameId}:${roundNumber}`
}

function roundKey(gameId: string, roundNumber: number): string {
  return `${gameId}:${roundNumber}`
}

function uniqueDetails(...details: Array<string | undefined>): string {
  const entries = details.flatMap(detail => detail?.split(' • ') || [])
  return [...new Set(entries.map(detail => detail.trim()).filter(Boolean))].join(' • ')
}

function addCandidate(items: Map<string, ReviewItem>, candidate: ReviewCandidate): void {
  const key = reviewKey(candidate.matchId, candidate.gameId, candidate.roundNumber)
  const existing = items.get(key)

  if (!existing) {
    items.set(key, {
      ...candidate,
      detail: candidate.detail || candidate.reason,
    })
    return
  }

  const candidateIsPreferred = candidate.severity > existing.severity
  const preferred = candidateIsPreferred ? candidate : existing
  items.set(key, {
    ...preferred,
    detail: candidateIsPreferred
      ? uniqueDetails(candidate.reason, candidate.detail, existing.detail, existing.reason)
      : uniqueDetails(existing.reason, existing.detail, candidate.reason, candidate.detail),
  })
}

function dateValue(date?: string): number {
  if (!date) return 0
  const value = Date.parse(date)
  return Number.isNaN(value) ? 0 : value
}

function getOpponentName(evidence: ReviewEvidence, focusTeamId: string): string {
  const opponent = evidence.derived?.mapsStats?.find(
    stat => stat.teamId !== focusTeamId && stat.teamName.trim()
  )
  return opponent ? normalizeTeamName(opponent.teamName) : 'Unknown opponent'
}

/** Return the earliest real round timestamp available for a series. */
export function getReviewSeriesDate(evidence: ReviewEvidence): string | undefined {
  let earliestTimestamp: string | undefined
  let earliestValue = Number.POSITIVE_INFINITY

  for (const round of evidence.rounds || []) {
    const timestamp = round.firstBlood?.timestamp
    if (!timestamp) continue

    const value = Date.parse(timestamp)
    if (!Number.isNaN(value) && value < earliestValue) {
      earliestTimestamp = timestamp
      earliestValue = value
    }
  }

  return earliestTimestamp
}

export const REVIEW_QUEUE_CAP = 50

export const REVIEW_SEVERITY_QUOTAS: Record<ReviewSeverity, number> = {
  5: 15,
  4: 12,
  3: 12,
  2: 8,
}

const REVIEW_SEVERITIES: ReviewSeverity[] = [5, 4, 3, 2]

function rankReviewItems(items: ReviewItem[]): ReviewItem[] {
  return items.sort(
    (a, b) => b.severity - a.severity || dateValue(b.date) - dateValue(a.date)
  )
}

function selectReviewItems(items: ReviewItem[]): ReviewItem[] {
  const ranked = rankReviewItems(items)
  const selected: ReviewItem[] = []
  const selectedKeys = new Set<string>()

  // Reserve representation for every severity before using spare capacity.
  for (const severity of REVIEW_SEVERITIES) {
    const bucket = ranked
      .filter(item => item.severity === severity)
      .slice(0, REVIEW_SEVERITY_QUOTAS[severity])

    for (const item of bucket) {
      selected.push(item)
      selectedKeys.add(reviewKey(item.matchId, item.gameId, item.roundNumber))
    }
  }

  // Backfill empty quota slots and the final spare slots with the best remaining rounds.
  for (const item of ranked) {
    if (selected.length >= REVIEW_QUEUE_CAP) break

    const key = reviewKey(item.matchId, item.gameId, item.roundNumber)
    if (selectedKeys.has(key)) continue
    selected.push(item)
    selectedKeys.add(key)
  }

  return rankReviewItems(selected).slice(0, REVIEW_QUEUE_CAP)
}

/**
 * Build a ranked, cross-series VOD review queue for a focus team.
 * This function is intentionally data-only so it can be reused outside React.
 */
export function computeReviewQueue(
  seriesList: ReviewSeriesInput[],
  focusTeamId: string
): ReviewItem[] {
  const items = new Map<string, ReviewItem>()

  for (const series of seriesList) {
    const evidence = series.evidence || {}
    const gameById = new Map(
      (evidence.games || []).map(game => [game.gameId, game.mapName])
    )
    const base = {
      matchId: series.matchId,
      gridSeriesId: series.gridSeriesId,
      opponentName: getOpponentName(evidence, focusTeamId),
      date: getReviewSeriesDate(evidence),
    }
    const mapNameFor = (gameId: string) => gameById.get(gameId) || series.map || 'Unknown map'

    const focusManAdvantage = evidence.derived?.manAdvantageStats?.find(
      stat => stat.teamId === focusTeamId
    )
    for (const throwRound of focusManAdvantage?.throwStats.throwRounds || []) {
      addCandidate(items, {
        ...base,
        gameId: throwRound.gameId,
        mapName: mapNameFor(throwRound.gameId),
        roundNumber: throwRound.roundNumber,
        category: 'throw',
        severity: 5,
        reason: `Lost from ${throwRound.situation} man advantage`,
      })
    }

    const economyByRound = new Map<string, ReviewEvidence['economyRounds']>()
    for (const economyRound of evidence.economyRounds || []) {
      const key = roundKey(economyRound.gameId, economyRound.roundNumber)
      const roundEconomy = economyByRound.get(key) || []
      roundEconomy.push(economyRound)
      economyByRound.set(key, roundEconomy)
    }

    for (const roundEconomy of economyByRound.values()) {
      if (!roundEconomy) continue
      const focusEconomy = roundEconomy.find(round => round.teamId === focusTeamId)
      const opponentLowBuy = roundEconomy.some(round =>
        round.teamId !== focusTeamId &&
        (round.economyTier === 'eco' || round.economyTier === 'save')
      )

      if (
        focusEconomy?.economyTier !== 'full_buy' ||
        focusEconomy.roundWon !== false ||
        !opponentLowBuy
      ) {
        continue
      }

      addCandidate(items, {
        ...base,
        gameId: focusEconomy.gameId,
        mapName: mapNameFor(focusEconomy.gameId),
        roundNumber: focusEconomy.roundNumber,
        category: 'lost_anti_eco',
        severity: 4,
        reason: 'Lost full buy vs eco/save',
      })
    }

    for (const clutch of evidence.clutchSituations || []) {
      if (clutch.won !== true || clutch.teamId === focusTeamId) continue

      addCandidate(items, {
        ...base,
        gameId: clutch.gameId,
        mapName: mapNameFor(clutch.gameId),
        roundNumber: clutch.roundNumber,
        category: 'opponent_clutch',
        severity: 4,
        reason: `${clutch.playerName || 'An opponent'} beat us in a ${clutch.situation}`,
      })
    }

    const focusPlantRounds = new Set(
      (evidence.plants || [])
        .filter(plant => plant.teamId === focusTeamId)
        .map(plant => roundKey(plant.gameId, plant.roundNumber))
    )
    for (const round of evidence.rounds || []) {
      if (
        round.hadPlant !== true ||
        round.winnerTeamId === focusTeamId ||
        !focusPlantRounds.has(roundKey(round.gameId, round.roundNumber))
      ) {
        continue
      }

      addCandidate(items, {
        ...base,
        gameId: round.gameId,
        mapName: mapNameFor(round.gameId),
        roundNumber: round.roundNumber,
        category: 'lost_post_plant',
        severity: 3,
        reason: 'Lost after planting',
      })
    }

    for (const criticalGame of evidence.derived?.criticalRounds || []) {
      for (const reviewRound of criticalGame.topReviewRounds || []) {
        const key = reviewKey(series.matchId, criticalGame.gameId, reviewRound.roundNumber)
        if (items.has(key)) continue

        addCandidate(items, {
          ...base,
          gameId: criticalGame.gameId,
          mapName: mapNameFor(criticalGame.gameId),
          roundNumber: reviewRound.roundNumber,
          category: 'critical_round',
          severity: 2,
          reason: reviewRound.reason,
          detail: reviewRound.coachingFocus || reviewRound.reason,
        })
      }
    }
  }

  return selectReviewItems([...items.values()])
}
