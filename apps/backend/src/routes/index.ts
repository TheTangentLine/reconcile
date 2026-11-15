import { Router } from 'express'
import { isDbReady } from '../db.js'
import { methodsRouter } from './methods.routes.js'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  const db = isDbReady()
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db: db ? 'up' : 'down' })
})

apiRouter.use('/methods', methodsRouter)
