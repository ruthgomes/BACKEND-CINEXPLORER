import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginInputSchema, loginResponseSchema, registerInputSchema } from './auth.schema';
import { createUser, findUserByEmail, verifyPassword } from './auth.service';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function authRoutes(app: FastifyInstance) {
    app.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Autentica um usuário',
      description: 'Realiza o login do usuário e retorna um token JWT',
      body: zodToJsonSchema(loginInputSchema),
      response: {
        200: {
          description: 'Login realizado com sucesso',
          ...zodToJsonSchema(loginResponseSchema)
        },
        401: {
          description: 'Credenciais inválidas',
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Credenciais inválidas' }
          }
        }
      },
      examples: [{
        summary: 'Login de usuário',
        value: {
          email: 'user@example.com',
          password: 'senha123'
        }
      }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
          tags: ['auth'],
          summary: 'Registra um novo usuário',
          description: 'Cria uma nova conta de usuário com dados fornecidos',
            body: zodToJsonSchema(registerInputSchema),
            response: {
                201: {
                    description: 'Usuário registrado com sucesso',
                    ...zodToJsonSchema(loginResponseSchema)
                },
                400: {
                  description: 'Email já em uso',
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Email already in use' }
                  }
                }
            },
            examples: [{
              summary: 'Registro de novo usuário',
              value: {
                name: 'Novo Usuário',
                email: 'novo@example.com',
                password: 'senha123'
              }
            }]
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
        onRequest: [(app as any).authenticate],
        schema: {
          tags: ['auth'],
          summary: 'Desloga o usuário',
          description: 'Invalida o token JWT do usuário (implementação simbólica)',
          security: [{ bearerAuth: [] }],
          response: {
            200: {
              description: 'Logout realizado com sucesso',
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Logged out successfully' }
              }
            }
          }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Logged out successfully' }
    })

    app.get('/me', {
        onRequest: [(app as any).authenticate],
        schema: {
          tags: ['auth'],
          summary: 'Obtém informações do usuário atual',
          description: 'Retorna os dados do usuário autenticado',
          security: [{ bearerAuth: [] }],
          response: {
                200: {
                    description: 'Dados do usuário',
                    $ref: 'User#'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        return request.user
    })
}