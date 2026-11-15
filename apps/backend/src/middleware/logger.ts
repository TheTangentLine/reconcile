import type { RequestHandler } from 'express'

/** One line per request: `GET /api/methods 200 3.1ms`. Health checks are skipped (Docker polls them). */
export const requestLogger: RequestHandler = (req, res, next) => {
  if (req.path === '/api/health') return next()
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    console.info(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`)
  })
  next()
}
