import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { prisma } from '../../lib/prisma'
import { 
    promotionSchema,
    promotionListSchema,
    createPromotionInputSchema,
    updatePromotionInputSchema,
    applyPromotionInputSchema,
    applyPromotionResponseSchema
} from './promotion.schema'
import { 
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    applyPromotion
} from './promotion.service'

export async function promotionRoutes(app: FastifyInstance) {
    app.get('/', {
        schema: {
            tags: ['promotions'],
            summary: 'List active promotions',
            description: 'Get a list of currently active promotions',
            response: {
                200: {
                    description: 'List of active promotions',
                    $ref: 'PromotionList'
                }
            }
        }
    }, async () => {
        return getPromotions()
    })

    app.post('/apply', {
        onRequest: [(app as any).authenticate],
        schema: {
            tags: ['promotions'],
            summary: 'Apply promotion',
            description: 'Apply a promotion code to a session',
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(applyPromotionInputSchema),
            response: {
                200: {
                    description: 'Promotion applied successfully',
                    $ref: 'ApplyPromotionResponse'
                },
                400: {
                    description: 'Bad request',
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Invalid or expired promotion' }
                    }
                }
            },
            examples: [{
                summary: 'Apply promotion',
                value: {
                    promotionCode: "SUMMER2023",
                    sessionId: "123e4567-e89b-12d3-a456-426614174000",
                    seats: [{ row: "A", number: 1 }]
                }
            }]
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { promotionCode, sessionId } = request.body as { promotionCode: string; sessionId: string }
        try {
            const promotion = await applyPromotion(promotionCode, sessionId);
            return {
                discount: promotion.discount,
                code: promotion.code,
                description: promotion.description
            };
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    })

    app.register(async (adminApp) => {
        adminApp.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                await request.jwtVerify()
                const userId = (request.user as { sub: string }).sub
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true }
                })
                if (!user || user.role !== 'ADMIN') {
                    throw new Error()
                }
            } catch (err) {
                reply.status(401).send({ message: 'Unauthorized: admin access required' })
            }
        })

        adminApp.post('/', {
            schema: {
                tags: ['promotions', 'admin'],
                summary: 'Create promotion',
                description: 'Create a new promotion (admin only)',
                security: [{ bearerAuth: [] }],
                body: zodToJsonSchema(createPromotionInputSchema),
                response: {
                    201: {
                        description: 'Promotion created successfully',
                        $ref: 'Promotion'
                    },
                    400: {
                        description: 'Bad request',
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Invalid promotion data' }
                        }
                    }
                }
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const promotion = await createPromotion(request.body);
                return reply.status(201).send(promotion);
            } catch (error: any) {
                return reply.status(400).send({ message: error.message });
            }
        })

        adminApp.put('/:id', {
            schema: {
                tags: ['promotions', 'admin'],
                summary: 'Update promotion',
                description: 'Update an existing promotion (admin only)',
                security: [{ bearerAuth: [] }],
                params: zodToJsonSchema(z.object({
                    id: z.string().uuid()
                })),
                body: zodToJsonSchema(updatePromotionInputSchema),
                response: {
                    200: {
                        description: 'Promotion updated successfully',
                        $ref: 'Promotion'
                    },
                    400: {
                        description: 'Bad request',
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Invalid promotion data' }
                        }
                    },
                    404: {
                        description: 'Promotion not found',
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Promotion not found' }
                        }
                    }
                }
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string }
            try {
                const promotion = await updatePromotion(id, request.body);
                if (!promotion) {
                    return reply.status(404).send({ message: 'Promotion not found' });
                }
                return promotion;
            } catch (error: any) {
                return reply.status(400).send({ message: error.message });
            }
        })

        adminApp.delete('/:id', {
            schema: {
                tags: ['promotions', 'admin'],
                summary: 'Delete promotion',
                description: 'Delete a promotion (admin only)',
                security: [{ bearerAuth: [] }],
                params: zodToJsonSchema(z.object({
                    id: z.string().uuid()
                })),
                response: {
                    204: {
                        description: 'Promotion deleted successfully'
                    },
                    404: {
                        description: 'Promotion not found',
                        type: 'object',
                        properties: {
                            message: { type: 'string', example: 'Promotion not found' }
                        }
                    }
                }
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string }
            try {
                await deletePromotion(id);
                return reply.status(204).send();
            } catch (error: any) {
                return reply.status(404).send({ message: error.message });
            }
        })
    })
}