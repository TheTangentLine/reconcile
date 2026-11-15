// Runtime configuration, read once from environment variables.

function int(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n)) throw new Error(`${name} must be an integer, got "${raw}"`)
  return n
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return ['1', 'true', 'yes'].includes(raw.toLowerCase())
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: int('PORT', 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/reconcile',
  /** Comma-separated list of origins allowed to call the API from a browser. */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** Insert the placeholder methods on startup when the collection is empty. */
  seedOnStart: bool('SEED_ON_START', false),
}
