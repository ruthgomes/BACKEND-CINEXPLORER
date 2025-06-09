import { z } from 'zod';

export const paymentMethodSchema = z.enum(['CREDIT', 'DEBIT', 'PIX'])
    .describe('Método de pagamento');
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const paymentStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
    .describe('Status do pagamento');
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
    id: z.string().uuid().describe('ID único do pagamento'),
    userId: z.string().uuid().describe('ID do usuário'),
    amount: z.number().positive().describe('Valor do pagamento'),
    method: paymentMethodSchema.describe('Método de pagamento'),
    status: paymentStatusSchema.describe('Status do pagamento'),
    installments: z.number().int().positive().max(12).optional().describe('Número de parcelas (apenas crédito)'),
    cardLastFour: z.string().length(4).optional().describe('Últimos 4 dígitos do cartão'),
    pixCode: z.string().optional().describe('Código PIX'),
    pixQrCode: z.string().url().optional().describe('URL do QR code PIX'),
    createdAt: z.coerce.date().describe('Data de criação'),
    updatedAt: z.coerce.date().describe('Data de atualização'),
    tickets: z.array(z.object({
        id: z.string().uuid(),
        type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']),
        price: z.number(),
        status: z.enum(['ACTIVE', 'USED', 'CANCELLED']),
        session: z.object({
            id: z.string().uuid(),
            date: z.coerce.date(),
            movie: z.object({
                id: z.string().uuid(),
                title: z.string(),
                posterUrl: z.string().url()
            }),
            cinema: z.object({
                id: z.string().uuid(),
                name: z.string()
            })
        }),
        seats: z.array(z.object({
            id: z.string().uuid(),
            row: z.string(),
            number: z.number()
        }))
    })).optional().describe('Ingressos gerados')
}).describe('Modelo de pagamento');

export const processPaymentInputSchema = z.object({
    sessionId: z.string().uuid().describe('ID da sessão'),
    reservationId: z.string().uuid().describe('ID da reserva'),
    seats: z.array(z.object({
        row: z.string().length(1).describe('Fileira do assento'),
        number: z.number().int().positive().describe('Número do assento')
    })).min(1).describe('Assentos reservados'),
    ticketTypes: z.array(z.object({
        type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']).describe('Tipo de ingresso'),
        count: z.number().int().positive().describe('Quantidade')
    })).min(1).describe('Tipos de ingressos'),
    totalAmount: z.number().positive().describe('Valor total do pagamento'),
    paymentMethod: paymentMethodSchema.describe('Método de pagamento'),
    paymentDetails: z.object({
        cardNumber: z.string().min(13).max(19).optional().describe('Número do cartão'),
        cardName: z.string().min(3).optional().describe('Nome no cartão'),
        expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/).optional().describe('Data de expiração (MM/YY)'),
        cvv: z.string().length(3).optional().describe('Código de segurança'),
        installments: z.number().int().positive().max(12).optional().describe('Número de parcelas')
    }).optional().describe('Detalhes do cartão (para crédito/débito)')
}).describe('Dados para processamento de pagamento');

export const processPaymentResponseSchema = z.object({
    paymentId: z.string().uuid().describe('ID do pagamento'),
    purchaseId: z.string().uuid().describe('ID da compra'),
    status: paymentStatusSchema.describe('Status do pagamento'),
    pixCode: z.string().optional().describe('Código PIX (se aplicável)'),
    pixQrCode: z.string().url().optional().describe('URL do QR code PIX (se aplicável)')
}).describe('Resposta do processamento de pagamento');

export const paymentStatusResponseSchema = z.object({
    status: paymentStatusSchema.describe('Status do pagamento')
}).describe('Resposta de status do pagamento');

export const paymentDetailsSchema = paymentSchema.extend({
    tickets: z.array(z.object({
        id: z.string().uuid(),
        type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']),
        price: z.number(),
        status: z.enum(['ACTIVE', 'USED', 'CANCELLED']),
        session: z.object({
            id: z.string().uuid(),
            date: z.coerce.date(),
            movie: z.object({
                id: z.string().uuid(),
                title: z.string(),
                posterUrl: z.string().url()
            }),
            cinema: z.object({
                id: z.string().uuid(),
                name: z.string()
            })
        }),
        seats: z.array(z.object({
            id: z.string().uuid(),
            row: z.string(),
            number: z.number()
        }))
    }))
}).describe('Detalhes completos do pagamento');

export const paymentSchemas = [
    { $id: 'Payment', schema: paymentSchema },
    { $id: 'PaymentMethod', schema: paymentMethodSchema },
    { $id: 'PaymentStatus', schema: paymentStatusSchema },
    { $id: 'ProcessPaymentInput', schema: processPaymentInputSchema },
    { $id: 'ProcessPaymentResponse', schema: processPaymentResponseSchema },
    { $id: 'PaymentStatusResponse', schema: paymentStatusResponseSchema },
    { $id: 'PaymentDetails', schema: paymentDetailsSchema }
];