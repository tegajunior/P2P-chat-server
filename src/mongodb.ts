import { MongoClient } from 'mongodb'
import { Application } from './declarations.js'

export default async function (app: Application): Promise<void> {
  const connection = app.get('mongodb')
  const client = await MongoClient.connect(connection, {})
  const db = client.db()
  app.set('mongoClient', db)
  console.log('MongoDB connected')
}
