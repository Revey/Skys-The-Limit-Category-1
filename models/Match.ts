import { Schema, model, models, type InferSchemaType, Types } from 'mongoose'

const MatchSchema = new Schema(
  {
    gridMatchId: { type: String, required: true, unique: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    opponentName: { type: String, required: true },
    map: { type: String, required: true },
    eventName: { type: String, required: true },
    date: { type: Date, required: true },
    rawData: { type: Schema.Types.Mixed, required: false, default: null },
  },
  { timestamps: true }
)

export type MatchDocument = InferSchemaType<typeof MatchSchema> & { _id: Types.ObjectId }

export const Match = models.Match || model('Match', MatchSchema)
