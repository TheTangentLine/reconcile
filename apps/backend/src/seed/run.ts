// CLI: `npm run seed` (dev) or `npm run seed:prod` (built image).
import { connectDb, disconnectDb } from '../db.js'
import { Method } from '../models/Method.js'
import { seedMethods } from './seed.js'

try {
  await connectDb()
  await Method.syncIndexes()
  const { upserted, modified } = await seedMethods()
  console.info(`[seed] done: ${upserted} inserted, ${modified} updated`)
} catch (err) {
  console.error('[seed] failed:', err)
  process.exitCode = 1
} finally {
  await disconnectDb()
}
