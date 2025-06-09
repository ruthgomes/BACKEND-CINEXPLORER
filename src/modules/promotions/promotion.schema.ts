import { z } from 'zod';

export const promotionSchema = z.object({
    id: z.string().uuid().describe('ID único da promoção'),
    title: z.string().min(3).describe('Título da promoção'),
    description: z.string().min(10).describe('Descrição detalhada da promoção'),
    discount: z.number().min(1).max(100).describe('Percentual de desconto (1-100)'),
    code: z.string().min(4).max(20).describe('Código da promoção (para uso no checkout)'),
    validFrom: z.coerce.date().describe('Data de início da validade'),
    validUntil: z.coerce.date().describe('Data de término da validade'),
    isActive: z.boolean().describe('Se a promoção está ativa'),
    createdAt: z.coerce.date().describe('Data de criação'),
    updatedAt: z.coerce.date().describe('Data de atualização'),
    applicableMovies: z.array(z.string().uuid()).optional().describe('IDs de filmes aplicáveis (se vazio, aplica-se a todos)'),
    applicableCinemas: z.array(z.string().uuid()).optional().describe('IDs de cinemas aplicáveis (se vazio, aplica-se a todos)')
}).describe('Modelo de promoção');

export const promotionListSchema = z.array(promotionSchema).describe('Lista de promoções');

export const createPromotionInputSchema = promotionSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
}).describe('Dados para criação de promoção');

export const updatePromotionInputSchema = createPromotionInputSchema.partial().describe('Dados para atualização de promoção');

export const applyPromotionInputSchema = z.object({
    promotionCode: z.string().min(4).max(20).describe('Código da promoção'),
    sessionId: z.string().uuid().describe('ID da sessão'),
    seats: z.array(z.object({
        row: z.string().length(1).describe('Fileira do assento'),
        number: z.number().int().positive().describe('Número do assento')
    })).min(1).describe('Assentos selecionados')
}).describe('Dados para aplicação de promoção');

export const applyPromotionResponseSchema = z.object({
    discount: z.number().min(1).max(100).describe('Percentual de desconto aplicado'),
    code: z.string().describe('Código da promoção'),
    description: z.string().describe('Descrição da promoção')
}).describe('Resposta de aplicação de promoção');

export const promotionSchemas = [
    { $id: 'Promotion', schema: promotionSchema },
    { $id: 'PromotionList', schema: promotionListSchema },
    { $id: 'CreatePromotionInput', schema: createPromotionInputSchema },
    { $id: 'UpdatePromotionInput', schema: updatePromotionInputSchema },
    { $id: 'ApplyPromotionInput', schema: applyPromotionInputSchema },
    { $id: 'ApplyPromotionResponse', schema: applyPromotionResponseSchema }
];