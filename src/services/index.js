import users from './users/users.service.js'

/**
 * Configure services
 * @param {import('../types.js').Application} app
 * @returns {void}
 */
export default function (app) {
  app.configure(users)
}
