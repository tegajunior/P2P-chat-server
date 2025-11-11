import { AuthenticationService, JWTStrategy } from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import type { Application } from './declarations.js'

export default function (app: Application): void {
  // Setting authentication configuration manually
  app.set('authentication', {
    secret: 'supersecretjwtkey',
    entity: 'user',
    service: 'users',
    authStrategies: ['jwt', 'local'],
    jwtOptions: {
      header: { typ: 'access' },
      audience: 'https://yourdomain.com',
      issuer: 'feathers',
      algorithm: 'HS256',
      expiresIn: '1d',
    },
    local: {
      usernameField: 'email',
      passwordField: 'password',
    },
  })

  const authentication = new AuthenticationService(app)

  // Register strategies
  authentication.register('jwt', new JWTStrategy())
  authentication.register('local', new LocalStrategy())

  // Mount service
  app.use('/authentication', authentication)

  console.log('Authentication service configured') // Just for debugging
}
