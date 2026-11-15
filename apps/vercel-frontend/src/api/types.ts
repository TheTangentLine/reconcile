// Shapes returned by the backend API (see backend/src/models/Method.ts).
import type { ColorKey } from '../cube/model'

export interface Formula {
  id: string
  name: string
  alg: string
  description: string
  /** Suggested way to hold the cube (center colors on Up / Front). */
  hold?: { up: ColorKey; front: ColorKey }
}

export interface Stage {
  id: string
  name: string
  goal: string
  formulas: Formula[]
}

export type Level = 'Beginner' | 'Intermediate' | 'Advanced'

interface MethodBase {
  slug: string
  name: string
  tagline: string
  level: Level
  avgMoves: string
  summary: string
  comingSoon?: boolean
  /** Big letter on the method tile. */
  letter: string
  /** Tile background color. */
  accent: string
  /** 3x3 sticker pattern (ColorKey per sticker, row by row) used as the method icon. */
  face: string
}

/** GET /api/methods/:slug */
export interface Method extends MethodBase {
  stages: Stage[]
}

/** GET /api/methods (list view, no stages) */
export interface MethodSummary extends MethodBase {
  stageCount: number
  formulaCount: number
}
