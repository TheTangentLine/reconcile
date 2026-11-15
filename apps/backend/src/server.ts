import type { Server } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDbWithRetry, disconnectDb } from './db.js'
import { Method } from './models/Method.js'
import { seedIfEmpty } from './seed/seed.js'

let server: Server | undefined
const stopping = new AbortController()

// Registered first so a stop signal also ends the connection retry loop.
async function shutdown(signal: string) {
  if (stopping.signal.aborted) return
  stopping.abort()
  console.info(`[api] ${signal} received, shutting down`)
  server?.close()
  await disconnectDb()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await connectDbWithRetry({ signal: stopping.signal })
} catch (err) {
  if (stopping.signal.aborted) process.exit(0)
  throw err
}
await Method.syncIndexes()
if (env.seedOnStart) await seedIfEmpty()

server = createApp().listen(env.port, () => {
  console.info(`[api] listening on :${env.port} (${env.nodeEnv})`)
})
