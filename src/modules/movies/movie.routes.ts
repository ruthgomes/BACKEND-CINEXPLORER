import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { movieQuerySchema, movieSchema, movieListSchema } from './movie.schema';
import { getMovies, getMovieById, getSimilarMovies, getMovieSessions } from './movie.service';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { prisma } from "../../lib/prisma";

export async function movieRoutes(app: FastifyInstance) {
    app.get('/', {
        schema: {
            tags: ['movies'],
            summary: 'Lista movies',
            description: 'Get a list of movies with optional filtering by status',
            querystring: zodToJsonSchema(movieQuerySchema),
            response: {
                200: {
                    description: 'List of movies',
                    $re: 'MovieList'
                },
                400: {
                    description: 'Invalid query parameters',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid status parameter' }
                    }
                }
            },
            examples: [{
                summary: 'Get current movies',
                value: {
                    status: 'current'
                }
            }, {
                summary: 'Get coming soon movies',
                value: {
                    status: 'coming-soon'
                }
            }]
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { status } = request.query as { status?: 'current' | 'coming-soon' };
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.get('/:id', {
        schema: {
            tags: ['movies'],
            summary: 'Get movie details',
            description: 'Get detailed information about a specific movie',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'Movie details',
                    $ref: 'MovieWithSessions'
                },
                404: {
                    description: 'Movie not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Movie not found'
                        }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const movie = await getMovieById(id);

        if (!movie) {
            return reply.status(404).send({ message: 'Movie not found' })
        }

        return movie
    });

    app.get('/:id/similar', {
        schema: {
            tags: ['movies'],
            summary: 'Get similar movies',
            description: 'Get movies similar to the specified movie (based on genres)',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'List of similar movies',
                    $ref: 'MovieList'
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

        const movieExists = await prisma.movie.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!movieExists) {
            return reply.status(404).send({ message: 'Movie not found' });
        }

        return getSimilarMovies(id);
    });

    app.get('/:id/sessions', {
        schema: {
            tags: ['movies'],
            summary: 'Get movie sessions',
            description: 'Get all sessions for a specific movie, optionally filtered by date',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            querystring: zodToJsonSchema(z.object({
                date: z.string().datetime().optional().describe('Filter sessions by date (ISO format')
            })),
            response: {
                200: {
                    description: 'List of sessions',
                    type: 'array',
                    items: { $ref: 'Session' }
                },
                404: {
                    description: 'Movie not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Movie not found' }
                    }
                }
            },
            examples: [{
                summary: 'Get sessions for a specific date',
                value: {
                    date: '2023-12-25T00:00:00Z'
                }
            }]
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const { date } = request.query as { date?: string };

        const movieExists = await prisma.movie.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!movieExists) {
            return reply.status(404).send({ message: 'Movie not found' });
        }

        return getMovieSessions(id, date);
    })
}