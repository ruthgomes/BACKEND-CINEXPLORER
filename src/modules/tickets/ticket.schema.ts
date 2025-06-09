import { z } from 'zod';

export const ticketStatusSchema = z.enum(['ACTIVE', 'USED', 'CANCELLED']).describe('Status do ingresso');
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketTypeSchema = z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']).describe('Tipo de ingresso');

export const ticketSchema = z.object({
    id: z.string().uuid().describe('ID único do ingresso'),
    sessionId: z.string().uuid().describe('ID da sessão'),
    userId: z.string().uuid().describe('ID do usuário'),
    type: ticketTypeSchema.describe('Tipo de ingresso'),
    price: z.number().positive().describe('Preço pago pelo ingresso'),
    qrCode: z.string().url().describe('URL do QR code para validação'),
    purchaseId: z.string().uuid().describe('ID da compra associada'),
    status: ticketStatusSchema.describe('Status do ingresso'),
    createdAt: z.coerce.date().describe('Data de criação do registro'),
    updatedAt: z.coerce.date().describe('Data da última atualização'),
    seats: z.array(z.object({
        id: z.string().uuid(),
        row: z.string(),
        number: z.number()
    })).describe('Assentos reservados'),
    session: z.object({
        id: z.string().uuid(),
        date: z.coerce.date(),
        time: z.string(),
        movie: z.object({
            id: z.string().uuid(),
            title: z.string(),
            posterUrl: z.string().url(),
            duration: z.number(),
            classification: z.string()
        }),
        cinema: z.object({
            id: z.string().uuid(),
            name: z.string(),
            address: z.string()
        }),
        room: z.object({
            id: z.string().uuid(),
            name: z.string()
        })
    }).optional().describe('Detalhes da sessão'),
    payment: z.object({
        id: z.string().uuid(),
        method: z.enum(['CREDIT', 'DEBIT', 'PIX']),
        amount: z.number(),
        status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
        createdAt: z.coerce.date()
    }).optional().describe('Detalhes do pagamento')
}).describe('Modelo de ingresso');

export const ticketListSchema = z.array(ticketSchema).describe('Lista de ingressos');

export const ticketQuerySchema = z.object({
    status: ticketStatusSchema.optional().describe('Filtrar por status do ingresso')
}).describe('Parâmetros de consulta para ingressos');

export const ticketSchemas = [
    { $id: 'Ticket', schema: ticketSchema },
    { $id: 'TicketList', schema: ticketListSchema },
    { $id: 'TicketQuery', schema: ticketQuerySchema },
    { $id: 'TicketStatus', schema: ticketStatusSchema },
    { $id: 'TicketType', schema: ticketTypeSchema }
];