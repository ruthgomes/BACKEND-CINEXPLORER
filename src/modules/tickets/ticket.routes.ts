import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ticketSchema, ticketListSchema, ticketQuerySchema } from './ticket.schema';
import { getTickets, getTicketById, generateTicketQRCode } from './ticket.service';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function ticketRoutes(app: FastifyInstance) {
    app.get('/', {
        onRequest: [(app as any).authenticate],
        schema: {
            querystring: zodToJsonSchema(ticketQuerySchema),
            response: {
                200: zodToJsonSchema(ticketListSchema)
            }
        }
    }, async (request: FastifyRequest<{ Querystring: z.infer<typeof ticketQuerySchema> }>) => {
        const userId = (request.user as { sub: string }).sub;
        return getTickets(userId, request.query.status);
    })

    app.get('/:id', {
        onRequest: [(app as any).authenticate],
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(ticketSchema)
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        const ticket = await getTicketById(id, userId);

        if (!ticket) {
            return reply.status(404).send({ message: 'Ticket not found' })
        }

        return ticket
    })

    app.get('/:id/qrcode', {
        onRequest: [(app as any).authenticate],
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(z.object({
                    qrCode: z.string().url()
                }))
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub

        const ticket = await getTicketById(id, userId)

        if (!ticket) {
            return reply.status(404).send({ message: 'Ticket not found' })
        }

        return {
            qrCode: await generateTicketQRCode(id)
        }
    })
}