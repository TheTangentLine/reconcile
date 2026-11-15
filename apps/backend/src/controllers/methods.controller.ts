import type { Request, Response } from 'express'
import { Method } from '../models/Method.js'
import { HttpError } from '../middleware/errors.js'

const HIDDEN = { _id: 0, __v: 0, order: 0, createdAt: 0, updatedAt: 0 } as const

/** GET /api/methods: every method without its stages, plus counts for the list UI. */
export async function listMethods(_req: Request, res: Response) {
  const methods = await Method.aggregate([
    { $sort: { order: 1, name: 1 } },
    {
      $addFields: {
        stageCount: { $size: '$stages' },
        formulaCount: { $sum: { $map: { input: '$stages', in: { $size: '$$this.formulas' } } } },
      },
    },
    { $project: { ...HIDDEN, stages: 0 } },
  ])
  res.json(methods)
}

/** GET /api/methods/:slug: one method with all stages and formulas. */
export async function getMethod(req: Request<{ slug: string }>, res: Response) {
  const method = await Method.findOne({ slug: req.params.slug.toLowerCase() }, HIDDEN).lean()
  if (!method) throw new HttpError(404, `Method "${req.params.slug}" not found`)
  res.json(method)
}

/** GET /api/methods/:slug/formulas/:formulaId: one formula plus the stage it belongs to. */
export async function getFormula(req: Request<{ slug: string; formulaId: string }>, res: Response) {
  const { slug, formulaId } = req.params
  const method = await Method.findOne(
    { slug: slug.toLowerCase(), 'stages.formulas.id': formulaId },
    { slug: 1, name: 1, stages: 1, _id: 0 },
  ).lean()

  for (const stage of method?.stages ?? []) {
    const formula = stage.formulas.find((f) => f.id === formulaId)
    if (formula) {
      res.json({
        method: { slug: method!.slug, name: method!.name },
        stage: { id: stage.id, name: stage.name, goal: stage.goal },
        formula,
      })
      return
    }
  }
  throw new HttpError(404, `Formula "${formulaId}" not found in method "${slug}"`)
}
