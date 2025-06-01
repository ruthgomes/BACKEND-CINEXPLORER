import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { movieQuerySchema, movieSchema, movieListSchema } from './movie.schema';
import { getMovies, getMovieById, getSimilarMovies, getMovieSessions } from './movie.service';
import { z } from "zod";

export async function movieRoutes(app: FastifyInstance) {
    app.get('/', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    status: { 
                        type: 'string',
                        enum: ['current', 'coming-soon']
                    }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: { $ref: 'Movie#' }
                }
            }
        }
    }, async (request: FastifyRequest) => {
        const { status } = request.query as { status?: 'current' | 'coming-soon' };
        return getMovies(status);
    })

    app.get('/:id', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid'}
                }
            },
            response: {
                200: {
                    $ref: 'Movie#'
                },
                404: {
                    type: 'object',
                    properties: {
                        message: { type: 'string'}
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
    })

    app.get('/:id/similar', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID of the movie to get similar movies'
                    }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: { $ref: 'Movie#' }
                }
            }
        }
    }, async (request: FastifyRequest) => {
        const { id } = request.params as { id: string };
        return getSimilarMovies(id);
    })

    app.get('/:id/sessions', {
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    date: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: { $ref: 'Session#' }
                }
            }
        }
    }, async (request: FastifyRequest) => {
        const { id } = request.params as { id: string };
        const { date } = request.query as { date?: string };
        return getMovieSessions(id, date);
    })
}