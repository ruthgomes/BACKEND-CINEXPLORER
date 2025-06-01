import { 
    FastifyInstance, 
    FastifyRequest, 
    FastifyReply 
} from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
    processPaymentInputSchema,
    processPaymentResponseSchema,
    paymentStatusResponseSchema
} from './payment.schema';
import {
    processPayment,
    getPaymentStatus
} from './payment.service';

export async function paymentRoutes(app: FastifyInstance) {
    app.post('/process', {
        onRequest: [(app as any).authenticate],
        schema: {
            body: zodToJsonSchema(processPaymentInputSchema),
            response: {
                200: zodToJsonSchema(processPaymentResponseSchema)
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request.user as { sub: string }).sub

        try {
            return await processPayment(userId, request.body as z.infer<typeof processPaymentInputSchema>)
        } catch (error: any) {
            return reply.status(400).send({ message: error.message })
        }
    })

    app.get('/:id/status', {
        onRequest: [(app as any).authenticate],
        schema: {
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: zodToJsonSchema(paymentStatusResponseSchema)
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub

        try {
            return await getPaymentStatus(id, userId)
        } catch (error: any) {
            return reply.status(400).send({ message: error.message })
        }
    })

    app.post('/pix/generate', {
        onRequest: [(app as any).authenticate],
        schema: {
            body: zodToJsonSchema(z.object({
                amount: z.number().positive()
            })),
            response: {
                200: zodToJsonSchema(z.object({
                    pixCode: z.string(),
                    pixQrCode: z.string()
                }))
            }
        }
    }, async () => {
        // In a real application, this would generate a PIX payment request
        const pixCode = `PIX-${crypto.randomUUID()}`
        return {
            pixCode,
            pixQrCode: `https://api.cinema.com/pix/qr/${pixCode}`
        }
    })
}