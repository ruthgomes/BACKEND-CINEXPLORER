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
import { FastifyTypedInstance } from './types'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export function buildApp() {
  const app = fastify({
    logger: true
  }).withTypeProvider<ZodTypeProvider>() as FastifyTypedInstance

  
  app.register(fastifyCors, { origin: '*' })
  
  app.register(fastifyJwt, { 
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '1d'
    } 
  })
  setupAuth(app)

  for (const schema of [...userSchemas, ...movieSchemas, ...cinemaSchemas, ...sessionSchemas, ...ticketSchemas, ...paymentSchemas, ...promotionSchemas]) {
    app.addSchema(schema)
  }

  app.register(fastifySwagger, withRefResolver({
    openapi: {
      info: {
        title: 'CineXplorer API',
        description: 'API completa para sistema de gerencimento de cinemas',
        version: '1.0.0',
        contact: {
          name: 'Suporte cineXplorer',
          email: 'suporte@cinexplorer.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [{
        url: `http://localhost:${env.API_PORT}`,
        description: 'Ambiente de desenvolvimento local'
      }],
      tags: [
        { name: 'admin', description: 'Operações administrativas (requer permissão de ADMIN)' },
        { name: 'auth', description: 'Autenticação e registro de usuários' },
        { name: 'movies', description: 'Operações relacionadas a filmes' },
        { name: 'cinemas', description: 'Operações relacionadas a cinemas' },
        { name: 'sessions', description: 'Operações relacionadas a sessões' },
        { name: 'tickets', description: 'Operações relacionadas a ingressos' },
        { name: 'payments', description: 'Oprações relacionadas a pagamentos' },
        { name: 'promotions', description: 'Operações relacionadas a promoções' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  }))

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })

  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(movieRoutes, { prefix: '/api/movies' })
  app.register(cinemaRoutes, { prefix: '/api/cinemas' })
  app.register(sessionRoutes, { prefix: '/api/sessions' })
  app.register(ticketRoutes, { prefix: '/api/tickets' })
  app.register(paymentRoutes, { prefix: '/api/payments' })
  app.register(adminRoutes, { prefix: '/api/admin' })
  app.register(promotionRoutes, { prefix: '/api/promotions' })

  app.get('/api/health', {
    schema: {
      tags: ['system'],
      description: 'Verifica a saúde da API',
      response: {
        200: {
          description: 'API está funcionando',
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  })

  return app
}