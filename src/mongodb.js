import { MongoClient } from 'mongodb'

/**
 * Initialize MongoDB connection
 * @param {import('./types.js').Application} app
 * @returns {Promise<void>}
 */
export default async function (app) {
  const connection = app.get('mongodb')
  const client = await MongoClient.connect(connection, {})
  const db = client.db()
  app.set('mongoClient', db)
  //   console.log('MongoDB connected')
}
