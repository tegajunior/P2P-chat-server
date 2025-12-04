/**
 * @typedef {import('@feathersjs/feathers').Application} FeathersApplication
 * @typedef {FeathersApplication} Application
 */

/**
 * @typedef {Object} User
 * @property {string} [_id]
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phoneNumber
 * @property {string} password
 */

/**
 * @typedef {Object} Message
 * @property {string} senderId
 * @property {string} receiverId
 * @property {string} content
 * @property {number} timestamp
 * @property {boolean} [delivered]
 */

/**
 * @typedef {Object} DmPayload
 * @property {string} from
 * @property {string} to
 * @property {string} text
 * @property {number} ts
 * @property {string} [clientId]
 * @property {any} [fromUser]
 */

export {}
