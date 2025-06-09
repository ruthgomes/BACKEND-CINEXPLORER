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
    getPaymentStatus,
    getPaymentDetails
} from './payment.service';

export async function paymentRoutes(app: FastifyInstance) {
    app.post('/process', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['payments'],
            summary: 'Process payment',
            description: 'Process payment for reserved seats and generate tickets',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(processPaymentInputSchema),
            response: {
                200: {
                    description: 'Payment processed successfully',
                    $ref: 'ProcessPaymentResponse'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid reservation' }
                    }
                }
            },
             examples: [{
                summary: 'Credit card payment',
                value: {
                    reservationId: "123e4567-e89b-12d3-a456-426614174000",
                    sessionId: "123e4567-e89b-12d3-a456-426614174001",
                    seats: [{ row: "A", number: 1 }],
                    ticketTypes: [{ type: "ADULT", count: 1 }],
                    totalAmount: 25.0,
                    paymentMethod: "CREDIT",
                    paymentDetails: {
                        cardNumber: "4111111111111111",
                        cardName: "John Doe",
                        expiryDate: "12/25",
                        cvv: "123",
                        installments: 1
                    }
                }
            }]
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request.user as { sub: string }).sub

        try {
            return await processPayment(userId, request.body as z.infer<typeof processPaymentInputSchema>);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    });

    app.get('/:id/status', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['payments'],
            summary: 'Get payment status',
            description: 'Get the current status of a payment',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'Payment status',
                    $ref: 'PaymentStatusResponse'
                },
                403: {
                    description: 'Forbidden',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: "You don't have access to this payment" }
                    }
                },
                404: {
                    description: 'Payment not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Payment not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        try {
            return await getPaymentStatus(id, userId)
        } catch (error: any) {
            if (error.message.includes('not found')) {
                return reply.status(404).send({ message: error.message });
            }
            if (error.message.includes('access')) {
                return reply.status(403).send({ message: error.message });
            }
            return reply.status(400).send({ message: error.message })
        }
    });

    app.get('/:id/details', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['payments'],
            summary: 'Get payment details',
            description: 'Get detailed information about a payment',
            security: [{ bearerAuth: [] }],
            params: zodToJsonSchema(z.object({
                id: z.string().uuid()
            })),
            response: {
                200: {
                    description: 'Payment details',
                    $ref: 'PaymentDetails'
                },
                403: {
                    description: 'Forbidden',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: "You don't have access to this payment" }
                    }
                },
                404: {
                    description: 'Paymento not found',
                    type: 'object',
                    properties: {
                        message: { type: 'object', example: 'Payment not found' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const userId = (request.user as { sub: string }).sub;

        try {
            return await getPaymentDetails(id, userId);
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

    app.post('/pix/generate', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['payments'],
            summary: 'Generate PIX payment',
            description: 'Generate a PIX payment request',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(z.object({
                amount: z.number().positive().describe('Valor do pagamento'),
                description: z.string().optional().describe('Descrição opcional do pagamento')
            })),
            response: {
                200: {
                    description: 'PIX payment generated',
                    type: 'object',
                    properties: {
                        pixCode: { type: 'string', description: 'Código PIX copia e cola' },
                        pixQrCode: { type: 'string', format: 'url', description: 'URL do QR code PIX' },
                        expiresAt: { type: 'string', format: 'date-time', description: 'Data de expiração do PIX' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest) => {
        const { amount, description } = request.body as { amount: number; description?: string };
        const pixCode = `00020126360014BR.GOV.BCB.PIX0114+55679987654325204000053039865404${amount.toFixed(2)}5802BR5925CINEXPLORER LTDA6007BRASILIA62070503***6304`;
        const pixQrCode = `https://api.cinexplorer.com/pix/qr/${encodeURIComponent(pixCode)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // expira em 24 horas

        return { 
            pixCode, 
            pixQrCode, 
            expiresAt: expiresAt.toISOString() 
        };
    });

    app.post('/webhook/pix', {
        schema: {
            tags: ['payments'],
            summary: 'PIX webhook',
            description: 'Endpoint para receber notificações de pagamentos PIX',
            body: zodToJsonSchema(z.object({
                event: z.string().describe('Tipo de evento'),
                payment: z.object({
                    id: z.string().describe('ID do pagamento'),
                    status: z.string().describe('Status do pagamento'),
                    amount: z.number().describe('Valo do pagamento'),
                    createdAt: z.string().describe('Data de criação'),
                    updateAt: z.string().describe('Data de atualização')
                })
            })),
            response: {
                200: {
                    description: 'Webhook processed successfully'
                }
            }
        }
    }, async (request: FastifyRequest) => {
        console.log('PIX webhook received:', request.body);
        return { ok: true }
    });
}