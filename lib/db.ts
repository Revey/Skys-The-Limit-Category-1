import mongoose from 'mongoose'

type MongooseConnection = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseConnection | undefined
}

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not set. Set it in .env.local to enable database access.')
}

let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectToDB() {
  if (cached!.conn) return cached!.conn
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, { dbName: 'c9-stratos' })
  }
  cached!.conn = await cached!.promise
  return cached!.conn
}

/**
 * Alias maintained for consistency with documentation and new components.
 */
export async function connectToDatabase() {
  return connectToDB()
}
