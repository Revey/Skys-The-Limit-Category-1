/**
 * Shared types for GRID evidence data structures.
 * Single source of truth for all evidence-related types across the codebase.
 * 
 * These types mirror the data extracted from GRID events.jsonl files
 * and stored in MongoDB under match.analytics.evidence_v1
 */

// =============================================================================
// Core Evidence Types
// =============================================================================

export interface MapStat {
  gameId: string
  teamId: string
  teamName: string
  roundsWon: number
  roundsLost?: number
  attackRoundsWon?: number
  defenseRoundsWon?: number
}

export interface GameInfo {
  gameId: string
  mapName: string
  sequenceNumber: number
}

export interface RoundInfo {
  gameId: string
  roundNumber: number
  winnerTeamId: string
  winType?: string
  winnerSide?: 'attack' | 'defense'
  firstBlood?: {
    killerId: string
    victimId: string
    killerTeamId: string
    timestamp: string
  }
  hadPlant: boolean
  hadDefuse: boolean
}

export interface KillEvent {
  gameId: string
  roundNumber: number
  timestamp: string
  killerId: string
  killerTeamId: string
  victimId: string
  victimTeamId: string
  weapon?: string
  weaponCategory?: string  // Sprint 1: rifle, smg, sniper, etc.
  isHeadshot?: boolean
  assistIds?: string[]
  isIsolated?: boolean
  isFirstBlood?: boolean
  nearestTeammateDistance?: number | null
  killerPosition?: Position
  victimPosition?: Position
  // Sprint 1: Engagement analysis
  killDistance?: number | null
  engagementRange?: string  // close, medium, long
}

export interface PlantEvent {
  gameId: string
  roundNumber: number
  timestamp: string
  planterId: string
  planterTeamId: string
  site: string
  position?: Position
}

export interface DefuseEvent {
  gameId: string
  roundNumber: number
  timestamp: string
  defuserId: string
  defuserTeamId: string
  site: string
}

export interface Position {
  x: number
  y: number
  z?: number
}

// =============================================================================
// Player Stats Types
// =============================================================================

export interface PlayerInfo {
  playerId: string
  playerName?: string
  teamId: string
  firstBloods: number
  firstDeaths: number
  kills: number
  deaths: number
  kd: number
  isolatedDeathsCount: number
}

export interface ClutchSituation {
  gameId: string
  roundNumber: number
  playerId: string
  playerName?: string
  teamId: string
  situation: string // e.g., "1v1", "1v2", "1v3"
  opponentsAlive: number
  won: boolean
}

export interface AbilityUse {
  gameId: string
  roundNumber: number
  timestamp: string
  playerId: string
  teamId: string
  agent: string
  abilityId: string
  abilityName: string
  position?: Position
}

export interface AgentComposition {
  playerId: string
  playerName?: string
  teamId: string
  agent: string
}

// =============================================================================
// Economy Types
// =============================================================================

export type EconomyTier = 'full_buy' | 'half_buy' | 'eco' | 'save'

export interface EconomyRound {
  gameId: string
  roundNumber: number
  teamId: string
  teamName: string
  avgLoadoutValue: number
  totalLoadoutValue: number
  economyTier: EconomyTier
  previousRoundWon: boolean | null
  roundWon: boolean
  playerLoadouts?: Array<{
    playerId: string
    loadoutValue: number
  }>
}

// =============================================================================
// Derived Stats Types
// =============================================================================

export interface FirstBloodStat {
  teamId: string
  teamName: string
  firstBloods: number
  firstDeaths: number
  firstBloodRate: number
  conversionRate: number // Win rate when getting first blood
}

export interface PlantStat {
  teamId: string
  teamName: string
  plants: number
  postPlantWins: number
  postPlantWinRate: number
}

export interface SiteStat {
  site: string
  attackStats: {
    [teamId: string]: {
      teamId: string
      teamName: string
      plants: number
      postPlantWins: number
      postPlantWinRate: number
    }
  }
  defenseStats: {
    [teamId: string]: {
      teamId: string
      teamName: string
      defenseAttempts: number
      defenseWins: number
      defenseWinRate: number
    }
  }
}

export interface ClutchStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  clutchAttempts: number
  clutchWins: number
  clutchRate: number
  breakdown: {
    [situation: string]: {
      attempts: number
      wins: number
    }
  }
}

export interface EconomyStat {
  teamId: string
  teamName: string
  byTier: {
    [tier: string]: {
      rounds: number
      wins: number
      winRate: number
    }
  }
  afterLoss: {
    [tier: string]: {
      rounds: number
      wins: number
      winRate: number
    }
  }
  afterWin: {
    [tier: string]: {
      rounds: number
      wins: number
      winRate: number
    }
  }
  forceAfterPistolLoss?: {
    attempts: number
    wins: number
    winRate: number
  }
}

export interface AbilityStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  totalAbilityUses: number
  roundsPlayed: number
  abilitiesPerRound: number
  agentBreakdown: Array<{
    agent: string
    totalUses: number
    abilities: Array<{
      name: string
      uses: number
    }>
  }>
}

export interface TradeKill {
  gameId: string
  roundNumber: number
  originalKillTimestamp: string
  tradeTimestamp: string
  timeDelta: number
  originalVictimId: string
  originalKillerId: string
  traderId: string
  traderTeamId: string
}

export interface TradeStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  deaths: number
  deathsTraded: number
  untradedDeaths: number
  tradedRate: number
  tradesGotten: number
}

export interface OpeningDuelStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  openingKills: number
  openingDeaths: number
  openingDuels: number
  openingDuelWinRate: number
  attackOpeningKills: number
  attackOpeningDeaths: number
  attackOpeningDuels: number
  attackOpeningWinRate: number
  defenseOpeningKills: number
  defenseOpeningDeaths: number
  defenseOpeningDuels: number
  defenseOpeningWinRate: number
  openingKillConversion: number
  openingDeathSurvival: number
}

export type MultiKillType = '2k' | '3k' | '4k' | 'ace'

export interface MultiKillRound {
  gameId: string
  roundNumber: number
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  kills: number
  type: MultiKillType
}

export interface MultiKillStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  twoKs: number
  threeKs: number
  fourKs: number
  aces: number
  totalMultiKills: number
  impactScore: number
}

// =============================================================================
// Sprint 1: New Analytics Types
// =============================================================================

export interface WeaponStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  totalKills: number
  byWeapon: {
    [weapon: string]: {
      kills: number
      percentage: number
    }
  }
  byCategory: {
    [category: string]: {
      kills: number
      percentage: number
    }
  }
  operatorKills: number
  operatorOpeningKills: number
}

export interface EngagementStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  byRange: {
    [range: string]: {
      kills: number
      deaths: number
      winRate: number
    }
  }
  preferredRange: string
  avgKillDistance: number
}

export interface TempoStat {
  teamId: string
  teamName: string
  attackStats: {
    avgTimeToPlant: number
    latePlantRate: number
    latePlantWinRate: number
    fastExecuteWinRate: number
  }
  defenseStats: {
    avgTimeToFirstKill: number
    earlyAggressionRate: number
  }
  byTempo: {
    [tempo: string]: {
      rounds: number
      wins: number
      winRate: number
    }
  }
}

export interface SaveRoundStat {
  teamId: string
  teamName: string
  saveRounds: number
  exitFragsAttempted: number
  saveRoundWins: number
  disciplineScore: number
}

export interface AntiEcoStat {
  teamId: string
  teamName: string
  antiEcoRounds: number
  antiEcoWins: number
  antiEcoWinRate: number
  deathsToEco: number
  deathsToForce: number
  problematicWeapons: Array<{
    weapon: string
    deaths: number
  }>
}

export interface HalfStat {
  teamId: string
  teamName: string
  gameId: string
  firstHalf: {
    side: 'attack' | 'defense' | null
    roundsWon: number
    roundsLost: number
    winRate: number
    pistolWon: boolean | null
  }
  secondHalf: {
    side: 'attack' | 'defense' | null
    roundsWon: number
    roundsLost: number
    winRate: number
    pistolWon: boolean | null
  }
  adaptation: {
    improved: boolean
    delta: number
  }
}

// =============================================================================
// Sprint 2: Tactical Depth & Ability Analytics Types
// =============================================================================

export interface AbilityCorrelation {
  gameId: string
  roundNumber: number
  abilityTimestamp: string
  killTimestamp: string
  timeDelta: number
  abilityUserId: string
  abilityUserName: string
  abilityId: string
  abilityName: string
  abilityCategory: 'flash' | 'smoke' | 'damage' | 'recon' | 'mobility' | 'other'
  killerId: string
  killerName: string
  victimId: string
  isSamePlayer: boolean
  isTeammateKill: boolean
}

export interface AbilityImpactStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  totalAbilityUses: number
  flashAssists: number
  flashAssistRate: number
  selfKillsAfterAbility: number
  teammateKillsAfterAbility: number
  utilityKillSetups: number
  abilityBreakdown: {
    [abilityId: string]: {
      uses: number
      correlatedKills: number
      effectiveness: number
    }
  }
}

export interface TeamUtilityStat {
  teamId: string
  teamName: string
  totalAbilityUses: number
  correlatedKills: number
  utilityCoordinationScore: number
  flashUses: number
  flashAssists: number
  topFlashPlayer: string | null
  mostEffectiveUtility: string | null
}

export interface PostPlantSiteStat {
  mapName: string
  site: string
  postPlantKills: number
  postPlantDeaths: number
  kdRatio: number
}

export interface PostPlantPlayerStat {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  postPlantKills: number
  postPlantDeaths: number
  postPlantKD: number
  avgKillPosition: { avgX: number; avgY: number } | null
  avgDeathPosition: { avgX: number; avgY: number } | null
}

export interface PostPlantStats {
  siteStats: PostPlantSiteStat[]
  playerStats: PostPlantPlayerStat[]
}

export interface MatchupEntry {
  kills: number
  deaths: number
  differential: number
}

export interface MatchupDetail {
  opponentId: string
  opponentName: string
  kills: number
  deaths: number
  differential: number
}

export interface MatchupPlayerSummary {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  favorableMatchups: MatchupDetail[]
  unfavorableMatchups: MatchupDetail[]
  nemesis: string | null
  nemesisDifferential: number
  victim: string | null
  victimDifferential: number
}

export interface MatchupStats {
  matrix: {
    [playerId: string]: {
      [opponentId: string]: MatchupEntry
    }
  }
  playerSummary: MatchupPlayerSummary[]
}

export interface MapControlStat {
  teamId: string
  teamName: string
  aggressiveOpenings: number
  aggressiveOpeningWins: number
  aggressiveOpeningWinRate: number
  earlyKills: number
  earlyDeaths: number
  earlyKillDifferential: number
}

// =============================================================================
// Main Evidence Structure
// =============================================================================

export interface EvidenceDerived {
  mapsStats: MapStat[]
  firstBloodStats: FirstBloodStat[]
  plantStats: PlantStat[]
  siteStats?: SiteStat[]
  clutchStats?: ClutchStat[]
  economyStats?: EconomyStat[]
  abilityStats?: AbilityStat[]
  tradeKills?: TradeKill[]
  tradeStats?: TradeStat[]
  openingDuelStats?: OpeningDuelStat[]
  multiKillRounds?: MultiKillRound[]
  multiKillStats?: MultiKillStat[]
  // Sprint 1: New analytics
  weaponStats?: WeaponStat[]
  engagementStats?: EngagementStat[]
  tempoStats?: TempoStat[]
  saveRoundStats?: SaveRoundStat[]
  antiEcoStats?: AntiEcoStat[]
  halfStats?: HalfStat[]
  // Sprint 2: Tactical Depth & Ability Analytics
  abilityCorrelations?: AbilityCorrelation[]
  abilityImpactStats?: AbilityImpactStat[]
  teamUtilityStats?: TeamUtilityStat[]
  postPlantStats?: PostPlantStats
  matchupStats?: MatchupStats
  mapControlStats?: MapControlStat[]
}

export interface EvidenceV1 {
  meta: {
    seriesId: string
    extractedAt: string
    version: string
    maxLinesProcessed?: number
    isoThreshold?: number
    filteredForGame?: string
    mapName?: string
  }
  games: GameInfo[]
  rounds: RoundInfo[]
  kills: KillEvent[]
  plants: PlantEvent[]
  defuses: DefuseEvent[]
  clutchSituations?: ClutchSituation[]
  economyRounds?: EconomyRound[]
  abilityUses?: AbilityUse[]
  players: PlayerInfo[]
  agentCompositions?: {
    [gameId: string]: AgentComposition[]
  }
  derived: EvidenceDerived
}

export interface EvidenceV1Meta {
  extractedAt: string
  version: string
  extractor?: string
}

// =============================================================================
// Utility Types
// =============================================================================

/** Helper to extract mapsStats with proper typing */
export function getMapsStats(evidence: EvidenceV1 | undefined | null): MapStat[] {
  return evidence?.derived?.mapsStats ?? []
}

/** Cloud9 team ID in GRID */
export const CLOUD9_TEAM_ID = '79'

/** Check if a team ID belongs to Cloud9 */
export function isCloud9(teamId: string): boolean {
  return teamId === CLOUD9_TEAM_ID
}
