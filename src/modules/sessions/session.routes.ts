import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sessionSchema, seatListSchema, reserveSeatsInputSchema, reserveSeatsResponseSchema } from './session.schema';
import { getSessionById, getSessionSeats, reserveSeats } from './session.service';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { prisma } from "../../lib/prisma";

export async function sessionRoutes(app: FastifyInstance) {
    app.get('/:id', {
        schema: {
            tags: ['sessions'],
            summary: 'Get session details',
            description: 'Get detailed information about a specifc session',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'Session details',
                    $ref: 'Session'
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
        const { id } = request.params as { id: string };
        const session = await getSessionById(id);

        if (!session) {
            return reply.status(404).send({ message: 'Session not found' });
        }

        return session;
    });

    app.get('/:id/seats', {
        schema: {
            tags: ['sessions'],
            summary: 'Get session seats',
            description: 'Get all seats for a specific session with their availability status',
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'List of seats with status',
                    $ref: 'SeatList'
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
        const { id } = request.params as { id: string };

        const sessionExists = await prisma.session.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!sessionExists) {
            return reply.status(404).send({ message: 'Session not found'});
        }

        return getSessionSeats(id);
    });

    app.post('/:id/reserve', {
        onRequest: [app.authenticate],
        schema: {
            tags: ['sessions'],
            summary: 'Reserve seats',
            description: 'Reserve seats for a specific session (reservation expires in 15 minutes)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            body: zodToJsonSchema(reserveSeatsInputSchema),
            response: {
                200: {
                    description: 'Seats reserved successfully',
                    $ref: 'ReserveSeatsResponse'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Session not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id: sessionId } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        const sessionExists = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { id: true}
        });

        if (!sessionExists) {
            return reply.status(404).send({ message: 'Session not found' });
        }

        try {
            const body = request.body as z.infer<typeof reserveSeatsInputSchema>;
            return await reserveSeats(sessionId, userId, body.seats, body.ticketTypes);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });
}