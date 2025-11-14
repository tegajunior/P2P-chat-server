import { Application } from '../../declarations'
import MongoDBService from 'feathers-mongodb'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import type { HookContext } from '@feathersjs/feathers'
import { User } from '../../types.js'

export default function (app: Application): void {
  const db = app.get('mongoClient')

  const options = {
    Model: db.collection('users'),
    paginate: app.get('paginate'),
    whitelist: ['$regex', '$options', '$or', '$ne'], //  Added $options for searching
  }

  app.use('/users', new MongoDBService(options))
  const service = app.service('users')

  service.hooks({
    before: {
      create: [
        async (context: HookContext) => {
          const data = context.data as User
          if (data?.password) {
            const salt = await bcrypt.genSalt(10)
            data.password = await bcrypt.hash(data.password, salt)
          }
          return context
        },
      ],

      find: [
        async (context: HookContext) => {
          const q = context.params.query ?? {}
          const search = q.search as string | undefined

          // If frontend uses `search`, convert to regex-based OR query
          if (search) {
            q.$or = [
              { email: { $regex: new RegExp(search, 'i') } },
              { phoneNumber: { $regex: new RegExp(search, 'i') } },
            ]
            delete q.search
          }

          // ✅ If frontend sends regex directly (like your searchUsers does),
          // just ensure the query is safe (MongoDB understands it natively)
          if (Array.isArray(q.$or)) {
            q.$or = q.$or.map((cond: any) => {
              const key = Object.keys(cond)[0]
              const value = cond[key]
              if (typeof value === 'string') {
                return { [key]: { $regex: new RegExp(value, 'i') } }
              }
              return cond
            })
          }

          // Exclude the logged-in user from search
          const selfId = (context.params as any)?.user?._id
          if (selfId) {
            try {
              q._id = { $ne: new ObjectId(selfId) }
            } catch {
              q._id = { $ne: selfId }
            }
          }

          if (q.$limit == null) q.$limit = 10

          context.params.query = q
          return context
        },
      ],
    },

    after: {
      all: [
        async (context: HookContext) => {
          // ✅ Strip password field in external responses
          const isExternal = !!context.params.provider
          if (!isExternal) return context

          const strip = (u: any) => {
            if (u?.password) delete u.password
            return u
          }

          if (Array.isArray((context as any).result?.data)) {
            ;(context as any).result.data = (context as any).result.data.map(
              strip
            )
          } else if (Array.isArray((context as any).result)) {
            ;(context as any).result = (context as any).result.map(strip)
          } else if ((context as any).result) {
            ;(context as any).result = strip((context as any).result)
          }

          return context
        },
      ],
    },
  })
}
