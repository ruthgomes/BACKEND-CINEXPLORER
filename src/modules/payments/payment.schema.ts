import { z } from 'zod';

export const paymentMethodSchema = z.enum(['CREDIT', 'DEBIT', 'PIX'])

export const paymentStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])

export const paymentSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    amount: z.number().positive(),
    method: paymentMethodSchema,
    status: paymentStatusSchema,
    installments: z.number().int().positive().optional(),
    cardLastFour: z.string().length(4).optional(),
    pixCode: z.string().optional(),
    pixQrCode: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    tickets: z.array(z.object({
        id: z.string().uuid()
    }))
})

export const processPaymentInputSchema = z.object({
    sessionId: z.string().uuid(),
    reservationId: z.string().uuid(),
    seats: z.array(z.object({
        row: z.string(),
        number: z.number()
    })),
    ticketTypes: z.array(z.object({
        type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']),
        count: z.number().int().positive()
    })),
    totalAmount: z.number().positive(),
    paymentMethod: paymentMethodSchema,
    paymentDetails: z.object({
        cardNumber: z.string().optional(),
        cardName: z.string().optional(),
        expiryDate: z.string().optional(),
        cvv: z.string().optional(),
        installments: z.number().int().positive().optional()
    }).optional()
})

export const processPaymentResponseSchema = z.object({
    paymentId: z.string().uuid(),
    purchaseId: z.string().uuid(),
    status: paymentStatusSchema,
    pixCode: z.string().optional(),
    pixQrCode: z.string().optional()
})

export const paymentStatusResponseSchema = z.object({
    status: paymentStatusSchema
})

export const paymentSchemas = [
    { $id: 'Payment', schema: paymentSchema },
    { $id: 'PaymentMethod', schema: paymentMethodSchema },
    { $id: 'PaymentStatus', schema: paymentStatusSchema },
    { $id: 'ProcessPaymentInput', schema: processPaymentInputSchema },
    { $id: 'ProcessPaymentResponse', schema: processPaymentResponseSchema },
    { $id: 'PaymentStatusResponse', schema: paymentStatusResponseSchema }
]