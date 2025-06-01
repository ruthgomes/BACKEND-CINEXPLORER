import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { cinemaQuerySchema, cinemaSchema, cinemaListSchema, roomListSchema } from './cinema.schema';
import { getCinemas, getCinemaById, getCinemaRooms, getCinemaSessions } from './cinema.service';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function cinemaRoutes(app: FastifyInstance) {
    app.get('/', {
        schema: {
            querystring: zodToJsonSchema(cinemaQuerySchema),
            response: {
                200: zodToJsonSchema(cinemaListSchema)
            }
        }
    }, async (request: FastifyRequest<{ Querystring: z.infer<typeof cinemaQuerySchema> }>) => {
        return getCinemas(request.query);
    })

    app.get('/:id', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(cinemaSchema)
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const cinema = await getCinemaById(id);

        if (!cinema) {
            return reply.status(404).send({ message: 'Cinema not found' });
        }

        return cinema;
    })

    app.get('/:id/rooms', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(roomListSchema)
            }
        }
    }, async (request: FastifyRequest) => {
        const { id } = request.params as { id: string };
        return getCinemaRooms(id);
    })

    app.get('/:id/sessions', {
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    type: 'array',
                    items: zodToJsonSchema(cinemaSchema)
                }
            }
        }
    }, async (request: FastifyRequest) => {
        const { id } = request.params as { id: string };
        return getCinemaSessions(id);
    })
}
