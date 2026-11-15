import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { requestLogger } from './middleware/logger.js'
import { apiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  // Behind nginx in Docker; trust its X-Forwarded-* headers.
  app.set('trust proxy', 1)

  app.use(requestLogger)
  app.use(cors({ origin: env.corsOrigins }))
  app.use(express.json({ limit: '100kb' }))

  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
