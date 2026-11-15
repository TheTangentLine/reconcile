import mongoose from 'mongoose'
import { env } from './config/env.js'

export async function connectDb(uri = env.mongoUri): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true)
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'))
  mongoose.connection.on('reconnected', () => console.info('[db] reconnected'))
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
  console.info(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`)
  return mongoose
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect()
}

/** 1 when connected, matching mongoose.ConnectionStates.connected. */
export function isDbReady(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected
}
