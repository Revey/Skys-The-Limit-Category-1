import mongoose from 'mongoose'

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
  conn: null,
  promise: null,
}

export async function connectToDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI is not set. Set it in .env.local to enable database access.')
    }

    cached.promise = mongoose.connect(uri, { dbName: 'c9-stratos' })
  }

  cached.conn = await cached.promise
  return cached.conn
}

/**
 * Alias maintained for consistency with documentation and new components.
 */
export async function connectToDatabase() {
  return connectToDB()
}
