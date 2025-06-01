import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginInputSchema, loginResponseSchema, registerInputSchema } from './auth.schema';
import { createUser, findUserByEmail, verifyPassword } from './auth.service';

export async function authRoutes(app: FastifyInstance) {
    app.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: 'User#' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }

    const user = await findUserByEmail(email)
    if (!user) {
      return reply.status(401).send({ message: 'Credenciais inválidas' })
    }

    const isPasswordValid = await verifyPassword(user, password)
    if (!isPasswordValid) {
      return reply.status(401).send({ message: 'Credenciais inválidas' })
    }

    const token = app.jwt.sign({
      sub: user.id,
      role: user.role
    })

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  })

    app.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' },
                        user: { $ref: 'User#' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { email } = request.body as { email: string };

        const existingUser = await findUserByEmail(email)
        if (existingUser) {
            return reply.status(400).send({ message: 'Email already in use' })
        }

        const user = await createUser(request.body as { name: string; email: string; password: string })

        const token = app.jwt.sign({
            sub: user.id,
            role: user.role
        })

        return reply.status(201).send({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    });

    app.post('/logout', {
        onRequest: [(app as any).authenticate]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Logged out successfully' }
    })

    app.get('/me', {
        onRequest: [(app as any).authenticate],
        schema: {
            response: {
                200: {
                    $ref: 'User'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        return request.user
    })
}