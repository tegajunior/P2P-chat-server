// src/services/index.ts
import { Application } from '../declarations.js'
import users from './users/users.service.js'

export default function (app: Application): void {
  app.configure(users)
}
