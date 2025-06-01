import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sessionSchema, seatListSchema, reserveSeatsInputSchema, reserveSeatsResponseSchema } from './session.schema';
import { getSessionById, getSessionSeats, reserveSeats } from './session.service';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function sessionRoutes(app: FastifyInstance) {
    app.get('/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(sessionSchema)
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const session = await getSessionById(id);

        if (!session) {
            return reply.status(404).send({ message: 'Session not found' })
        }

        return session;
    })

    app.get('/:id/seats', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(seatListSchema)
            }
        }
    }, async (request: FastifyRequest) => {
        const { id } = request.params as { id: string };
        return getSessionSeats(id);
    })

    app.post('/:id/reserve', {
        onRequest: [(app as any).authenticate],
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            body: zodToJsonSchema(reserveSeatsInputSchema),
            response: {
                200: zodToJsonSchema(reserveSeatsResponseSchema)
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        try {
            const body = request.body as z.infer<typeof reserveSeatsInputSchema>;
            return await reserveSeats(id, userId, body.seats)
        } catch (error: any) {
            return reply.status(400).send({ message: error.message })
        }
    })
}