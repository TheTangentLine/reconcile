import { Method } from '../models/Method.js'
import { SEED_METHODS } from './methods.js'

/**
 * Upsert every seed method by slug. Safe to run repeatedly: existing methods
 * are overwritten with the seed content, other methods are left alone.
 */
export async function seedMethods(): Promise<{ upserted: number; modified: number }> {
  const res = await Method.bulkWrite(
    SEED_METHODS.map((m, order) => ({
      updateOne: {
        filter: { slug: m.slug },
        update: { $set: { ...m, comingSoon: m.comingSoon ?? false, order } },
        upsert: true,
      },
    })),
  )
  return { upserted: res.upsertedCount, modified: res.modifiedCount }
}

/** Seed only when the collection is empty (used on container start). */
export async function seedIfEmpty(): Promise<void> {
  if ((await Method.estimatedDocumentCount()) > 0) return
  const { upserted } = await seedMethods()
  console.info(`[seed] collection was empty, inserted ${upserted} methods`)
}
