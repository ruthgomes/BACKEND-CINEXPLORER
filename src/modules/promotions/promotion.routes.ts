import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { prisma } from '../../lib/prisma'
import { 
    promotionSchema,
    promotionListSchema,
    createPromotionInputSchema,
    updatePromotionInputSchema,
    applyPromotionInputSchema
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
            response: {
                200: {
                    $ref: 'PromotionList'
                }
            }
        }
    }, async () => {
        return getPromotions()
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
                body: zodToJsonSchema(createPromotionInputSchema),
                response: {
                    201: {
                        $ref: 'Promotion'
                    }
                }
            }
        }, async (request: FastifyRequest) => {
            return createPromotion(request.body)
        })

        adminApp.put('/:id', {
            schema: {
                params: zodToJsonSchema(z.object({
                    id: z.string().uuid()
                })),
                body: zodToJsonSchema(updatePromotionInputSchema),
                response: {
                    200: {
                        $ref: 'Promotion'
                    }
                }
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string }
            const promotion = await updatePromotion(id, request.body)
            if (!promotion) {
                return reply.status(404).send({ message: 'Promotion not found' })
            }
            return promotion
        })

        adminApp.delete('/:id', {
            schema: {
                params: zodToJsonSchema(z.object({
                    id: z.string().uuid()
                }))
            }
        }, async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string }
            await deletePromotion(id)
            return reply.status(204).send()
        })
    })

    app.post('/apply', {
        onRequest: [(app as any).authenticate],
        schema: {
            body: zodToJsonSchema(applyPromotionInputSchema),
            response: {
                200: {
                    $ref: 'Promotion'
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { promotionCode, sessionId } = request.body as { promotionCode: string; sessionId: string }
        try {
            return await applyPromotion(promotionCode, sessionId)
        } catch (error: any) {
            return reply.status(400).send({ message: error.message })
        }
    })
}