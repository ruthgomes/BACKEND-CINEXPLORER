import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ticketSchema, ticketListSchema, ticketQuerySchema } from './ticket.schema';
import { getTickets, getTicketById, generateTicketQRCode, cancelTicket } from './ticket.service';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function ticketRoutes(app: FastifyInstance) {
    app.get('/', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['tickets'],
            summary: 'Get user tickets',
            description: 'Get all tickets for the authenticated user, optionally filtered by status',
            security: [{ bearerAuth: [] }],
            querystring: zodToJsonSchema(ticketQuerySchema),
            response: {
                200: {
                    description: 'List of user tickets',
                    $ref: 'TicketList'
                }
            },
            examples: [{
                summary: 'Get active tickets',
                value: {
                    status: 'ACTIVE'
                }
            }]
        }
    }, async (request: FastifyRequest<{ Querystring: z.infer<typeof ticketQuerySchema> }>) => {
        const userId = (request.user as { sub: string }).sub;
        return getTickets(userId, request.query.status);
    });

    app.get('/:id', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['tickets'],
            summary: 'Get ticket details',
            description: 'Get detailed information about a specific ticket',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'Ticket details',
                    $ref: 'Ticket'
                },
                403: {
                    description: 'Forbidden',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: "You don't have access to this ticket" }
                    }
                },
                404: {
                    description: 'Ticket not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Ticket not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        const ticket = await getTicketById(id, userId);

        if (!ticket) {
            return reply.status(404).send({ message: 'Ticket not found' });
        }

        if (ticket.userId !== userId) {
            return reply.status(403).send({ message: "You don't have access to this ticket" });
        }

        return ticket;
    });

    app.get('/:id/qrcode', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['tickets'],
            summary: 'Get ticket QR code',
            description: 'Get a QR code for ticket validation',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'QR code URL',
                    type: 'object',
                    properties: {
                        qrCode: { type: 'string', format: 'url', description: 'URL do QR code' }
                    }
                },
                403: {
                    description: 'Forbidden',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: "You don't have access to this ticket" }
                    }
                },
                404: {
                    description: 'Ticket not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Ticket not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        const ticket = await getTicketById(id, userId);

        if (!ticket) {
            return reply.status(404).send({ message: 'Ticket not found' });
        }

        if (ticket.userId !== userId) {
            return reply.status(403).send({ message: "You don't have access to this ticket" });
        }

        return {
            qrCode: await generateTicketQRCode(id)
        };
    });

    app.post('/:id/cancel', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['tickets'],
            summary: 'Cancel ticket',
            description: 'Cancel a ticker (if allowed by policy)',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                204: {
                    description: 'Ticket cancelled successfully'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Ticket cannot be cancelled' }
                    }
                },
                403: {
                    description: 'Forbidden',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: "You don't have access to this ticket" }
                    }
                },
                404: {
                    description: 'Ticket not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Ticket not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        try {
            await cancelTicket(id, userId);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('not found')) {
                return reply.status(404).send({ message: error.message });
            }
            if (error.message.includes('access')) {
                return reply.status(403).send({ message: error.message });
            }
            return reply.status(400).send({ message: error.message });
        }
    });
}