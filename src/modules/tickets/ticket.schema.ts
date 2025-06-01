import { z } from 'zod';

export const ticketSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    userId: z.string().uuid(),
    type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']),
    price: z.number().positive(),
    qrCode: z.string(),
    purchaseId: z.string().uuid(),
    status: z.enum(['ACTIVE', 'USED', 'CANCELLED']),
    createdAt: z.date(),
    updatedAt: z.date(),
    seats: z.array(z.object({
        id: z.string().uuid(),
        row: z.string(),
        number: z.number()
    }))
})

export const ticketListSchema = z.array(ticketSchema);

export const ticketQuerySchema = z.object({
    status: z.enum(['ACTIVE', 'USED', 'CANCELLED']).optional()
})

export const ticketSchemas = [
    { $id: 'Ticket', schema: ticketSchema },
    { $id: 'TicketList', schema: ticketListSchema },
    { $id: 'TicketQuery', schema: ticketQuerySchema }
]