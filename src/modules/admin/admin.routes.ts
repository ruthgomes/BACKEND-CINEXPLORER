import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { prisma } from '../../lib/prisma';
import { 
    createMovieInputSchema,
    updateMovieInputSchema,
    createCinemaInputSchema,
    updateCinemaInputSchema,
    createRoomInputSchema,
    createSessionInputSchema
} from './admin.schema';
import { 
    checkAdmin,
    adminCreateMovie,
    adminUpdateMovie,
    adminDeleteMovie,
    adminGetCinemas,
    adminCreateCinema,
    adminUpdateCinema,
    adminDeleteCinema,
    adminCreateRoom,
    adminGetSessions,
    adminCreateSession,
    adminDeleteSession
} from './admin.service';

export async function adminRoutes(app: FastifyInstance) {
    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify()
            const userId = (request.user as { sub: string }).sub
            await checkAdmin(userId)
        } catch (err) {
            reply.status(401).send({ message: 'Unauthorized' })
        }
    })

    app.get('/Movies', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: { $ref: 'Movie' }
                }
            }
        }
    }, async () => {
        return prisma.movie.findMany()
    })

    app.post('/Movies', {
        schema: {
            body: zodToJsonSchema(createMovieInputSchema),
            response: {
                201: {
                    $ref: 'Movie'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        return adminCreateMovie(request.body)
    })

    app.put('/movies/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            body: zodToJsonSchema(updateMovieInputSchema),
            response: {
                200: {
                    $ref: 'Movie'
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string }
        const movie = await adminUpdateMovie(id, request.body)

        if (!movie) {
            return reply.status(404).send({ message: 'Movie not found' })
        }

        return movie
    })

    app.delete('/movies/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            }))
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string }
        await adminDeleteMovie(id)
        return reply.status(204).send()
    })

    app.get('/cinemas', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: { $ref: 'Cinema'}
                }
            }
        }
    }, async () => {
        return adminGetCinemas()
    })

    app.post('/cinemas', {
        schema: {
            body: zodToJsonSchema(createCinemaInputSchema),
            response: {
                201: {
                    $ref: 'Cinema'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        return adminCreateCinema(request.body)
    })

    app.put('/cinemas/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            body: zodToJsonSchema(updateCinemaInputSchema),
            response: {
                200: {
                    $ref: 'Cinema'
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string }
        const cinema = await adminUpdateCinema(id, request.body)

        if (!cinema) {
            return reply.status(404).send({ message: 'Cinema not found' })
        }

        return cinema
    })

    app.delete('/cinemas/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            }))
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string }
        await adminDeleteCinema(id)
        return reply.status(204).send()
    })

    app.post('/rooms', {
        schema: {
            body: zodToJsonSchema(createRoomInputSchema),
            response: {
                201: {
                    $ref: 'Room'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        return adminCreateRoom(request.body)
    })

    app.get('/session', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: { $ref: 'Session' }
                }
            }
        }
    }, async () => {
        return adminGetSessions()
    })

    app.post('/sessions', {
        schema: {
            body: zodToJsonSchema(createSessionInputSchema),
            response: {
                201: {
                    $ref: 'Session'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        return adminCreateSession(request.body)
    })

    app.delete('/sessions/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            }))
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params  as { id: string }
        await adminDeleteSession(id)
        return reply.status(204).send()
    })
}