import { feathers } from '@feathersjs/feathers'
import express, { rest } from '@feathersjs/express'
import expressCore from 'express'
import socketio from '@feathersjs/socketio'
import cors from 'cors'

import mongodb from './mongodb.js'
import authentication from './authentication.js'
import services from './services/index.js'

const OFFLINE_QUEUE_MAX = 200 // Max queued messages per user
const OFFLINE_QUEUE_TTL_MS = 15 * 60000 // 15 minutes

/**
 * Create and configure the Feathers application
 * @returns {Promise<any>}
 */
export const createApp = async () => {
  const app = express(feathers())

  // ---------------- PRESENCE & QUEUES ---------------------//
  // userId -> Set<socketId>
  const socketsByUser = new Map()
  // socketId -> userId (reverse lookup)
  const userBySocket = new Map()
  // userId -> queued messages (dropped on delivery or TTL)
  const offlineQueue = new Map()

  app.set('mongodb', process.env.MONGO_URI)
  app.set('socketsByUser', socketsByUser)
  app.set('userBySocket', userBySocket)
  app.set('offlineQueue', offlineQueue)

  // ---------------- Middleware & REST ----------------
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    })
  )
  app.use(expressCore.json())
  app.use(expressCore.urlencoded({ extended: true }))
  app.configure(rest())

  // ---------------- Socket.IO (P2P transport) ----------------

  /**
   * Ensure user has a socket set
   * @param {string} uid
   * @returns {Set<string>}
   */
  const ensureUserSet = (uid) => {
    if (!socketsByUser.has(uid)) socketsByUser.set(uid, new Set())
    return socketsByUser.get(uid)
  }

  /**
   * Remove expired messages from queue
   * @param {string} uid
   * @returns {void}
   */
  const pruneQueue = (uid) => {
    const q = offlineQueue.get(uid)
    if (!q) return
    const now = Date.now()
    const valid = q.filter((m) => now - m.queuedAt < OFFLINE_QUEUE_TTL_MS)
    if (valid.length) offlineQueue.set(uid, valid)
    else offlineQueue.delete(uid)
  }

  app.configure(
    socketio((io) => {
      io.on('connection', (socket) => {
        console.log('socket connected:', socket.id)

        socket.on('presence:iam', (payload) => {
          const uid = String(payload?.userId || '')
          if (!uid) return

          userBySocket.set(socket.id, uid)
          const set = ensureUserSet(uid)
          set.add(socket.id)
          socket.join(`user/${uid}`)

          if (set.size === 1) {
            io.emit('user:online', { userId: uid })
          }

          // Drain offline queue (with slight delay to ensure client is ready)
          pruneQueue(uid)
          const backlog = offlineQueue.get(uid)
          if (backlog?.length) {
            // console.log(
            //   `Preparing to deliver ${backlog.length} queued messages to ${uid}...`
            // )

            // Delay delivery slightly so client finishes reauth and rebinds listeners
            setTimeout(() => {
              const stillConnected = io.sockets.adapter.rooms.get(`user/${uid}`)
              if (stillConnected && stillConnected.size > 0) {
                backlog.forEach((m) => {
                  io.to(`user/${uid}`).emit('dm:receive', m)
                  //   console.log(`Delivered queued message to ${uid}:`, m.text)
                })
                offlineQueue.delete(uid)
                // console.log(
                //   `All ${backlog.length} queued messages delivered to ${uid}`
                // ) // For debugging
              } else {
                console.warn(`User ${uid} disconnected before queue delivery`) // For debugging
              }
            }, 1000) // 1 second delay
          }

          // Snapshot of who's online
          io.to(socket.id).emit('presence:snapshot', {
            online: Array.from(socketsByUser.keys()),
          })
        })

        socket.on('presence:leave', (payload) => {
          const uidFromPayload = String(payload?.userId || '')
          const uid = uidFromPayload || userBySocket.get(socket.id)
          if (!uid) return

          // Remove reverse mapping for this socket
          userBySocket.delete(socket.id)

          // Remove socket from user's set and if empty emit offline
          const set = socketsByUser.get(uid)
          if (set) {
            set.delete(socket.id)
            socket.leave(`user/${uid}`)
            if (set.size === 0) {
              socketsByUser.delete(uid)
              io.emit('user:offline', { userId: uid })
            }
          }
        })

        // Handle direct message send and offline message queueing
        socket.on('dm:send', (msg) => {
          const from = userBySocket.get(socket.id)
          if (!from) return

          const payload = {
            from,
            to: String(msg.to),
            text: String(msg.text || ''),
            ts: msg.ts || Date.now(),
            clientId: msg.clientId,
            fromUser: msg.fromUser || null,
          }

          const targetRoom = `user/${payload.to}`
          const room = io.sockets.adapter.rooms.get(targetRoom)

          // Acknowledge to sender
          socket.emit('dm:ack', { clientId: payload.clientId, ts: payload.ts })

          if (room && room.size > 0) {
            // User is online deliver instantly
            io.to(targetRoom).emit('dm:receive', payload)
            console.log(`delivered to online user ${payload.to}`)
          } else {
            // User is offline queue message and if queue is longer than defined, remove the first message
            const queued = offlineQueue.get(payload.to) || []
            queued.push({ ...payload, queuedAt: Date.now() })

            if (queued.length > OFFLINE_QUEUE_MAX) {
              queued.splice(0, queued.length - OFFLINE_QUEUE_MAX)
            }
            offlineQueue.set(payload.to, queued)
            console.log(`📦 queued message for offline user ${payload.to}`) // Just for debugging
          }
        })

        // Snapshot request to know who is online
        socket.on('presence:who', () => {
          socket.emit('presence:snapshot', {
            online: Array.from(socketsByUser.keys()),
          })
        })

        // Disconnect user when logged out
        socket.on('disconnect', () => {
          const uid = userBySocket.get(socket.id)
          userBySocket.delete(socket.id)

          if (uid) {
            const set = socketsByUser.get(uid)
            if (set) {
              set.delete(socket.id)
              if (set.size === 0) {
                socketsByUser.delete(uid)
                io.emit('user:offline', { userId: uid })
              }
            }
          }
        })
      })
    })
  )

  // ---------------- DB + Auth (only for /users) ----------------
  await mongodb(app)
  app.configure(authentication)

  // Feathers channels for users service (not used for P2P messages)
  app.on('connection', (connection) => {
    app.channel('anonymous').join(connection)
  })

  // Don't bind login to presence; the client's `presence:iam` is the source of truth.
  app.on('login', () => {
    // no-op for P2P
  })

  // Users service (and any other non-message services you already had)
  app.configure(services)

  // Root health route
  app.use('/', (req, res) => {
    res.json({ message: 'P2P gateway live (no message persistence)' })
  })

  return app
}
