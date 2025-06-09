import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { cinemaQuerySchema, cinemaSchema, cinemaListSchema, roomListSchema } from './cinema.schema';
import { getCinemas, getCinemaById, getCinemaRooms, getCinemaSessions } from './cinema.service';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { prisma } from "../../lib/prisma";

export async function cinemaRoutes(app: FastifyInstance) {
    app.get('/', {
        schema: {
            tags: ['cinemas'],
            summary: 'List cinemas',
            description: 'Get a list of cinemas, optionally sorted by distance or name',
            querystring: zodToJsonSchema(cinemaQuerySchema),
            response: {
                200: {
                    description: 'List of cinemas',
                    $ref: 'CinemaList'
                },
                400: {
                    description: 'Invalid location parameters',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Both lat and lng are required for distance sorting' }
                    }
                }
            },
            examples: [{
                summary: 'List cinemas sorted by name',
                value: {
                    sort: 'name'
                }
            }, {
                summary: 'List cinemas sorted by distance',
                value: {
                    lat: -23.5505,
                    lng: -46.6333,
                    sort: 'distance'
                }
            }]
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const query = request.query as z.infer<typeof cinemaQuerySchema>;

            if (query.sort === 'distance' && (!query.lat || !query.lng)) {
                return reply.status(400).send({ message: 'Both lat and lng are required for distance sorting' });
            }
            return await getCinemas(query);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.get('/:id', {
        schema: {
            tags: ['cinemas'],
            summary: 'Get cinema details',
            description: 'Get detailed information abou a specific cinema',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'Cinema details',
                    $ref: 'Cinema'
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
        const cinema = await getCinemaById(id);

        if (!cinema) {
            return reply.status(404).send({ message: 'Cinema not found' });
        }

        return cinema;
    });

    app.get('/:id/rooms', {
        schema: {
            tags: ['cinemas'],
            summary: 'Get cinema rooms',
            description: 'Get all rooms for a specific cinema',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'List of rooms',
                    $ref: 'RoomList'
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

        const cinemaExists = await prisma.cinema.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!cinemaExists) {
            return reply.status(404).send({ message: 'Cinema not found' });
        }

        return getCinemaRooms(id);
    });

    app.get('/:id/sessions', {
        schema: {
            tags: ['cinemas'],
            summary: 'Get cinema sessions',
            description: 'Get all sessions for a specific cinema',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            querystring: zodToJsonSchema(z.object({
                date: z.string().datetime().optional().describe('Filter sessions by date (ISO format)'),
                movieId: z.string().uuid().optional().describe('Filter sessions by movie')
            })),
            response: {
                200: {
                    description: 'List of sessions',
                    type: 'array',
                    items: { $ref: 'Session' }
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
        const { date, movieId } = request.query as { date?: string; movieId?: string };

        const cinemaExists = await prisma.cinema.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!cinemaExists) {
            return reply.status(404).send({message: 'Cinema not found' });
        }

        return getCinemaSessions(id, date, movieId);
    });
}
