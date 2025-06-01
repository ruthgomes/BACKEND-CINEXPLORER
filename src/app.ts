import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyCors from '@fastify/cors'
import { withRefResolver } from 'fastify-zod'
import { env } from './config/env'
import { setupAuth } from './lib/auth'
import { authRoutes } from './modules/auth/auth.routes'
import { movieRoutes } from './modules/movies/movie.routes'
import { cinemaRoutes } from './modules/cinemas/cinema.routes'
import { sessionRoutes } from './modules/sessions/session.routes'
import { ticketRoutes } from './modules/tickets/ticket.routes'
import { paymentRoutes } from './modules/payments/payment.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { userSchemas } from './modules/auth/auth.schema'
import { movieSchemas } from './modules/movies/movie.schema'
import { cinemaSchemas } from './modules/cinemas/cinema.schema'
import { sessionSchemas } from './modules/sessions/session.schema'
import { ticketSchemas } from './modules/tickets/ticket.schema'
import { paymentSchemas } from './modules/payments/payment.schema'
import { promotionRoutes } from './modules/promotions/promotion.routes'
import { promotionSchemas } from './modules/promotions/promotion.schema'
import { set } from 'zod/v4'

export function buildApp() {
  const app = fastify({
    logger: true
  })

  
  app.register(fastifyCors, { origin: '*' })
  
  app.register(fastifyJwt, { secret: env.JWT_SECRET })
  setupAuth(app)

  for (const schema of [...userSchemas, ...movieSchemas, ...cinemaSchemas, ...sessionSchemas, ...ticketSchemas, ...paymentSchemas, ...promotionSchemas]) {
    app.addSchema(schema)
  }

  app.register(fastifySwagger, withRefResolver({
    openapi: {
      info: {
        title: 'Cinema API',
        description: 'API for Cinema Management System',
        version: '1.0.0'
      },
      servers: [{
        url: `http://localhost:${env.API_PORT}`
      }]
    }
  }))

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs'
  })

  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(movieRoutes, { prefix: '/api/movies' })
  app.register(cinemaRoutes, { prefix: '/api/cinemas' })
  app.register(sessionRoutes, { prefix: '/api/sessions' })
  app.register(ticketRoutes, { prefix: '/api/tickets' })
  app.register(paymentRoutes, { prefix: '/api/payments' })
  app.register(adminRoutes, { prefix: '/api/admin' })
  app.register(promotionRoutes, { prefix: '/api/promotions' })

  app.get('/api/health', async () => {
    return { status: 'ok' }
  })

  return app
}