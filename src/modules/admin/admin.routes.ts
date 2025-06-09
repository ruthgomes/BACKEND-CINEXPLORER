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
            reply.status(401).send({ message: 'Unauthorized: admin access required' });
        }
    });

    app.get('/Movies', {
        schema: {
            tags: ['admin', 'movies'],
            summary: 'List all movies (admin)',
            description: 'Get a list of all movies (admin only)',
            security: [{bearerAuth: []}],
            response: {
                200: {
                    description: 'List of movies',
                    $ref: 'MovieList'
                }
            }
        }
    }, async () => {
        return prisma.movie.findMany({
            orderBy: {
                releaseDate: 'desc'
            }
        });
    });

    app.post('/Movies', {
        schema: {
            tags: ['admin', 'movies'],
            summary: 'Create movie (admin)',
            description: 'Create a new movie (admin only)',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createMovieInputSchema),
            response: {
                201: {
                    description: 'Movie created successfully',
                    $ref: 'Movie'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid movie data' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const movie = await adminCreateMovie(request.body);
            return reply.status(201).send(movie);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.put('/movies/:id', {
        schema: {
            tags: ['admin', 'movies'],
            summary: 'Update movie (admin)',
            description: 'Update an existing movie (admin only)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            body: zodToJsonSchema(updateMovieInputSchema),
            response: {
                200: {
                    description: 'Movie updated successfully',
                    $ref: 'Movie'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid movie data' }
                    }
                },
                404: {
                    description: 'Movie not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Movie not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        try {
            const movie = await adminUpdateMovie(id, request.body);

            if (!movie) {
                return reply.status(404).send({ message: 'Movie not found' });
            }
            return movie;
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.delete('/movies/:id', {
        schema: {
            tags: ['admin', 'movies'],
            summary: 'Delete movie (admin)',
            description: 'Delete a movie (admin only)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                204: {
                    description: 'Movie deleted successfully'
                },
                404: {
                    description: 'Movie not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Movie not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string }
        try {
            await adminDeleteMovie(id);
            return reply.status(204).send();
        } catch (error: any) {
            return reply.status(404).send({ message: error.message });
        }
    });

    app.get('/cinemas', {
        schema: {
            tags: ['admin', 'cinemas'],
            summary: 'List all cinemas (admin)',
            description: 'Get a list of all cinemas (admin only)',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'List of cinemas',
                    $ref: 'CinemaList'
                }
            }
        }
    }, async () => {
        return adminGetCinemas();
    });

    app.post('/cinemas', {
        schema: {
            tags: ['admin', 'cinemas'],
            summary: 'Create cinema (admin)',
            description: 'Create a new cinema (admin only)',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createCinemaInputSchema),
            response: {
                201: {
                    description: 'Cinema created successfully',
                    $ref: 'Cinema'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid cinema data' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const cinema = await adminCreateCinema(request.body);
            return reply.status(201).send(cinema);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.put('/cinemas/:id', {
        schema: {
            tags: ['admin', 'cinemas'],
            summary: 'Update cinema (admin)',
            description: 'Update an existing cinema (admin only)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            body: zodToJsonSchema(updateCinemaInputSchema),
            response: {
                200: {
                    description: 'Cinema updated successfully',
                    $ref: 'Cinema'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid cinema data' }
                    }
                },
                404: {
                    description: 'Cinema not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Cinema not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        try {
            const cinema = await adminUpdateCinema(id, request.body)
            if (!cinema) {
                return reply.status(404).send({ message: 'Cinema not found' })
            }
            return cinema
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.delete('/cinemas/:id', {
        schema: {
            tags: ['admin', 'cinemas'],
            summary: 'Delete cinema (admin)',
            description: 'Delete a cinema (admin only)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                204: {
                    description: 'Cinema deleted successfully'
                },
                404: {
                    description: 'Cinema not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Cinema not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        try {
            await adminDeleteCinema(id);
            return reply.status(204).send();
        } catch (error: any) {
            return reply.status(404).send({ message: error.message });
        }
    });

    app.post('/rooms', {
        schema: {
            tags: ['admin', 'rooms'],
            summary: 'Create room (admin)',
            description: 'Create a new room in a cinema (admin only)',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createRoomInputSchema),
            response: {
                201: {
                    description: 'Room created successfully',
                    $ref: 'Room'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid room data' }
                    }
                },
                404: {
                    description: 'Cinema not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Cinema not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const room = await adminCreateRoom(request.body);
            return reply.status(201).send(room);
        } catch (error: any) {
            if (error.message.includes('Cinema not found')) {
                return reply.status(404).send({ message: error.message });
            }
            return reply.status(400).send({ message: error.message });
        }
    });

    app.get('/sessions', {
        schema: {
            tags: ['admin', 'sessions'],
            summary: 'List all sessions (admin)',
            description: 'Get a list of all sessions (admin only)',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'List of sessions',
                    $ref: 'Session'
                }
            }
        }
    }, async () => {
        return adminGetSessions();
    });

    app.post('/sessions', {
        schema: {
            tags: ['admin', 'sessions'],
            summary: 'Create session (admin)',
            description: 'Create a new session (admin only)',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createSessionInputSchema),
            response: {
                201: {
                    description: 'Session created successfully',
                    $ref: 'Session'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid session data' }
                    }
                },
                404: {
                    description: 'Movie, cinema or room not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Movie not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const session = await adminCreateSession(request.body);
            return reply.status(201).send(session);
        } catch (error: any) {
            if (error.message.includes('not found')) {
                return reply.status(404).send({ message: error.message });
            }
            return reply.status(400).send({ message: error.message });
        }
    });

    app.delete('/sessions/:id', {
        schema: {
            tags: ['admin', 'sessions'],
            summary: 'Delete session (admin)',
            description: 'Delete a session (admin only)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                204: {
                    description: 'Session deleted successfully'
                },
                404: {
                    description: 'Session not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Session not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params  as { id: string };
        try {
            await adminDeleteSession(id);
            return reply.status(204).send();
        } catch (error: any) {
            return reply.status(404).send({ message: error.message });
        }
    });
}