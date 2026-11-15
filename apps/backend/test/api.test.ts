import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { connectDb, disconnectDb } from '../src/db.js'
import { Method } from '../src/models/Method.js'
import { SEED_METHODS } from '../src/seed/methods.js'
import { seedIfEmpty, seedMethods } from '../src/seed/seed.js'

let mongo: MongoMemoryServer
const app = createApp()

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await connectDb(mongo.getUri('reconcile-test'))
  await Method.syncIndexes()
})

afterAll(async () => {
  await disconnectDb()
  await mongo?.stop()
})

beforeEach(async () => {
  await Method.deleteMany({})
  await seedMethods()
})

describe('GET /api/health', () => {
  it('reports the database as up', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', db: 'up' })
  })
})

describe('GET /api/methods', () => {
  it('lists every method in seed order with counts and no stages', async () => {
    const res = await request(app).get('/api/methods')
    expect(res.status).toBe(200)
    expect(res.body.map((m: { slug: string }) => m.slug)).toEqual(SEED_METHODS.map((m) => m.slug))

    const cfop = res.body.find((m: { slug: string }) => m.slug === 'cfop')
    const seed = SEED_METHODS.find((m) => m.slug === 'cfop')!
    expect(cfop.stageCount).toBe(seed.stages.length)
    expect(cfop.formulaCount).toBe(seed.stages.reduce((n, s) => n + s.formulas.length, 0))
    expect(cfop).not.toHaveProperty('stages')
    expect(cfop).not.toHaveProperty('_id')
    expect(cfop).not.toHaveProperty('__v')
  })
})

describe('GET /api/methods/:slug', () => {
  it('returns the full method with stages and formulas', async () => {
    const res = await request(app).get('/api/methods/beginner')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Absolute Beginner')
    expect(res.body.stages.length).toBeGreaterThan(0)
    expect(res.body.stages[0].formulas[0]).toMatchObject({ id: expect.any(String), alg: expect.any(String) })
    expect(res.body).not.toHaveProperty('_id')
  })

  it('matches the slug case-insensitively', async () => {
    const res = await request(app).get('/api/methods/CFOP')
    expect(res.status).toBe(200)
    expect(res.body.slug).toBe('cfop')
  })

  it('returns 404 for an unknown method', async () => {
    const res = await request(app).get('/api/methods/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/not found/i)
  })
})

describe('GET /api/methods/:slug/formulas/:id', () => {
  it('returns the formula with its stage and method', async () => {
    const res = await request(app).get('/api/methods/cfop/formulas/pll-t')
    expect(res.status).toBe(200)
    expect(res.body.method).toEqual({ slug: 'cfop', name: 'CFOP' })
    expect(res.body.stage.id).toBe('pll')
    expect(res.body.formula).toMatchObject({ id: 'pll-t', name: 'T-perm' })
  })

  it('returns 404 when the formula belongs to another method', async () => {
    const res = await request(app).get('/api/methods/roux/formulas/pll-t')
    expect(res.status).toBe(404)
  })
})

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Route GET /api/nope not found' })
  })
})

describe('seeding', () => {
  it('is idempotent', async () => {
    await seedMethods()
    expect(await Method.countDocuments()).toBe(SEED_METHODS.length)
  })

  it('seedIfEmpty leaves existing data alone', async () => {
    await Method.updateOne({ slug: 'cfop' }, { $set: { name: 'Edited' } })
    await seedIfEmpty()
    expect((await Method.findOne({ slug: 'cfop' }).lean())?.name).toBe('Edited')
  })

  it('seedIfEmpty fills an empty collection', async () => {
    await Method.deleteMany({})
    await seedIfEmpty()
    expect(await Method.countDocuments()).toBe(SEED_METHODS.length)
  })
})

describe('Method model', () => {
  it('rejects an invalid face pattern', async () => {
    const seed = SEED_METHODS[0]!
    await expect(Method.create({ ...seed, slug: 'bad-face', face: 'XXXXXXXXX' })).rejects.toThrow(/face/)
  })
})
