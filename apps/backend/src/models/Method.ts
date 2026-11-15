import { Schema, model, type InferSchemaType } from 'mongoose'

export const COLOR_KEYS = ['W', 'Y', 'G', 'B', 'R', 'O'] as const
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

const holdSchema = new Schema(
  {
    up: { type: String, enum: COLOR_KEYS, required: true },
    front: { type: String, enum: COLOR_KEYS, required: true },
  },
  { _id: false },
)

// Stages and formulas are embedded: they are always read together with
// their method and have no meaning on their own. Each keeps the string `id`
// the frontend uses in URLs and state, so Mongo's _id is turned off for them.
const formulaSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    alg: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    hold: { type: holdSchema, required: false },
  },
  { _id: false, id: false },
)

const stageSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String, required: true },
    formulas: { type: [formulaSchema], default: [] },
  },
  { _id: false, id: false },
)

const methodSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    avgMoves: { type: String, required: true },
    summary: { type: String, required: true },
    stages: { type: [stageSchema], default: [] },
    comingSoon: { type: Boolean, default: false },
    letter: { type: String, required: true, maxlength: 2 },
    accent: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    face: { type: String, required: true, match: /^[WYGBRO]{9}$/ },
    /** Display order in lists. */
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id
        return ret
      },
    },
  },
)

methodSchema.index({ order: 1, name: 1 })

export type MethodDoc = InferSchemaType<typeof methodSchema>
export const Method = model('Method', methodSchema)
