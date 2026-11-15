import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDb, disconnectDb } from './db.js'
import { Method } from './models/Method.js'
import { seedIfEmpty } from './seed/seed.js'

await connectDb()
await Method.syncIndexes()
if (env.seedOnStart) await seedIfEmpty()

const server = createApp().listen(env.port, () => {
  console.info(`[api] listening on :${env.port} (${env.nodeEnv})`)
})

let closing = false
async function shutdown(signal: string) {
  if (closing) return
  closing = true
  console.info(`[api] ${signal} received, shutting down`)
  server.close()
  await disconnectDb()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
