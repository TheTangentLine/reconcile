import { setTimeout as sleep } from 'node:timers/promises'
import mongoose from 'mongoose'
import { env } from './config/env.js'

mongoose.set('strictQuery', true)
mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'))
mongoose.connection.on('reconnected', () => console.info('[db] reconnected'))

export async function connectDb(uri = env.mongoUri): Promise<typeof mongoose> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 })
  console.info(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`)
  return mongoose
}

/**
 * Keep trying until the database answers. On startup the database may not be
 * up yet (e.g. all pods starting at once in Kubernetes); exiting would put the
 * pod into CrashLoopBackOff and delay recovery long after MongoDB is ready.
 */
export async function connectDbWithRetry(
  { uri = env.mongoUri, delayMs = 2_000, signal }: { uri?: string; delayMs?: number; signal?: AbortSignal } = {},
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await connectDb(uri)
      return
    } catch (err) {
      if (signal?.aborted) throw err
      const reason = err instanceof Error ? err.message : String(err)
      console.warn(`[db] connection attempt ${attempt} failed (${reason}), retrying in ${delayMs / 1000}s`)
      await sleep(delayMs, undefined, signal ? { signal } : undefined)
    }
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect()
}

/** 1 when connected, matching mongoose.ConnectionStates.connected. */
export function isDbReady(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected
}
