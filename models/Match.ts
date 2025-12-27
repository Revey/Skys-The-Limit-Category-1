import { Schema, model, models, Types } from 'mongoose'

const PlayerStatsSchema = new Schema(
  {
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    agent: { type: String, required: false },
    kills: { type: Number, required: true },
    deaths: { type: Number, required: true },
    assists: { type: Number, required: false, default: 0 },
    rating: { type: Number, required: false },
  },
  { _id: false }
)

const MatchSchema = new Schema(
  {
    // Existing fields
    gridMatchId: { type: String, required: true, unique: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    opponentName: { type: String, required: true },
    map: { type: String, required: true },
    eventName: { type: String, required: true },
    date: { type: Date, required: true },
    rawData: { type: Schema.Types.Mixed, required: false, default: null },

    // GRID integration fields (all optional for backwards compatibility)
    gridSeriesId: { type: String, required: false },
    tournamentId: { type: String, required: false },
    titleId: { type: String, required: false },
    teamRoundsWon: { type: Number, required: false },
    teamRoundsLost: { type: Number, required: false },
    attackRoundsWon: { type: Number, required: false },
    defenseRoundsWon: { type: Number, required: false },
    players: { type: [PlayerStatsSchema], required: false, default: undefined },
    startTime: { type: Date, required: false }, // Real match start time from manifest

    // Analytics fields (optional, backward compatible)
    analytics: {
      type: {
        evidence_v1: { type: Schema.Types.Mixed, required: false },
        evidence_v1_meta: {
          type: {
            extractedAt: { type: String, required: false },
            version: { type: String, required: false },
            extractor: { type: String, required: false },
          },
          required: false,
        },
      },
      required: false,
      default: undefined,
    },
  },
  { timestamps: true }
)

export type PlayerStats = {
  playerId: string
  playerName: string
  agent?: string
  kills: number
  deaths: number
  assists?: number
  rating?: number
}

export type EvidenceV1 = {
  meta: {
    seriesId: string
    extractedAt: string
    version: string
    maxLinesProcessed?: number
    isoThreshold?: number
    // Added by filterEvidenceByGame when filtering to a specific map
    filteredForGame?: string
    mapName?: string
  }
  games: Array<{
    gameId: string
    mapName: string
    sequenceNumber: number
  }>
  rounds: Array<{
    gameId: string
    roundNumber: number
    winnerTeamId: string
    winType?: string
    winnerSide?: string
    firstBlood?: {
      killerId: string
      victimId: string
      killerTeamId: string
      timestamp: string
    }
    hadPlant: boolean
    hadDefuse: boolean
  }>
  kills: unknown[]
  plants: unknown[]
  defuses: unknown[]
  clutchSituations?: Array<{
    gameId: string
    roundNumber: number
    playerId: string
    playerName?: string
    teamId: string
    situation: string
    opponentsAlive: number
    won: boolean
  }>
  economyRounds?: Array<{
    gameId: string
    roundNumber: number
    teamId: string
    teamName: string
    avgLoadoutValue: number
    totalLoadoutValue: number
    economyTier: 'full_buy' | 'half_buy' | 'eco' | 'save'
    previousRoundWon: boolean | null
    roundWon: boolean
    playerLoadouts?: Array<{
      playerId: string
      loadoutValue: number
    }>
  }>
  abilityUses?: Array<{
    gameId: string
    roundNumber: number
    timestamp: string
    playerId: string
    teamId: string
    agent: string
    abilityId: string
    abilityName: string
    position?: {
      x: number
      y: number
      z?: number
    }
  }>
  players: Array<{
    playerId: string
    playerName?: string
    teamId: string
    firstBloods: number
    firstDeaths: number
    kills: number
    deaths: number
    kd: number
    isolatedDeathsCount: number
  }>
  agentCompositions?: {
    [gameId: string]: Array<{
      playerId: string
      playerName?: string
      teamId: string
      agent: string
    }>
  }
  derived: {
    mapsStats: unknown[]
    firstBloodStats: unknown[]
    plantStats: unknown[]
    siteStats?: Array<{
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
    }>
    clutchStats?: Array<{
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
    }>
    economyStats?: Array<{
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
    }>
    abilityStats?: Array<{
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
    }>
    tradeKills?: Array<{
      gameId: string
      roundNumber: number
      originalKillTimestamp: string
      tradeTimestamp: string
      timeDelta: number
      originalVictimId: string
      originalKillerId: string
      traderId: string
      traderTeamId: string
    }>
    tradeStats?: Array<{
      playerId: string
      playerName: string
      teamId: string
      teamName: string
      deaths: number
      deathsTraded: number
      untradedDeaths: number
      tradedRate: number
      tradesGotten: number
    }>
    openingDuelStats?: Array<{
      playerId: string
      playerName: string
      teamId: string
      teamName: string
      // Overall
      openingKills: number
      openingDeaths: number
      openingDuels: number
      openingDuelWinRate: number
      // Attack side
      attackOpeningKills: number
      attackOpeningDeaths: number
      attackOpeningDuels: number
      attackOpeningWinRate: number
      // Defense side
      defenseOpeningKills: number
      defenseOpeningDeaths: number
      defenseOpeningDuels: number
      defenseOpeningWinRate: number
      // Conversion
      openingKillConversion: number  // % of opening kills leading to round wins
      openingDeathSurvival: number   // % of opening deaths where team still won
    }>
    multiKillRounds?: Array<{
      gameId: string
      roundNumber: number
      playerId: string
      playerName: string
      teamId: string
      teamName: string
      kills: number
      type: '2k' | '3k' | '4k' | 'ace'
    }>
    multiKillStats?: Array<{
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
    }>
  }
}

export type MatchDocument = {
  _id: Types.ObjectId
  gridMatchId: string
  team: Types.ObjectId
  opponentName: string
  map: string
  eventName: string
  date: Date
  rawData?: unknown

  // GRID integration fields (optional)
  gridSeriesId?: string
  tournamentId?: string
  titleId?: string
  teamRoundsWon?: number
  teamRoundsLost?: number
  attackRoundsWon?: number
  defenseRoundsWon?: number
  players?: PlayerStats[]
  startTime?: Date // Real match start time from manifest

  // Analytics fields (optional)
  analytics?: {
    evidence_v1?: EvidenceV1
    evidence_v1_meta?: {
      extractedAt: string
      version: string
      extractor?: string
    }
  }

  createdAt: Date
  updatedAt: Date
}

export const Match = models.Match || model('Match', MatchSchema)
