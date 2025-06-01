import { z } from 'zod';

export const promotionSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    discount: z.number().min(0).max(100),
    code: z.string(),
    validFrom: z.date(),
    validUntil: z.date(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    applicableMovies: z.array(z.string().uuid()).optional(),
    applicableCinemas: z.array(z.string().uuid()).optional()
})

export const promotionListSchema = z.array(promotionSchema)

export const createPromotionInputSchema = promotionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
})

export const updatePromotionInputSchema = createPromotionInputSchema.partial()

export const applyPromotionInputSchema = z.object({
    promotionCode: z.string(),
    sessionId: z.string().uuid(),
    seats: z.array(z.object({
        row: z.string(),
        number: z.number()
    }))
})

export const promotionSchemas = [
    { $id: 'Promotion', schema: promotionSchema },
    { $id: 'PromotionList', schema: promotionListSchema },
    { $id: 'CreatePromotionInput', schema: createPromotionInputSchema },
    { $id: 'UpdatePromotionInput', schema: updatePromotionInputSchema },
    { $id: 'ApplyPromotionInput', schema: applyPromotionInputSchema }
]