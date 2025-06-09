import { z } from 'zod';

export const sessionSchema = z.object({
    id: z.string().uuid().describe('ID único da sessão'),
    movieId: z.string().uuid().describe('ID do filme'),
    cinemaId: z.string().uuid().describe('ID do cinema'),
    roomId: z.string().uuid().describe('ID da sala'),
    date: z.coerce.date().describe('Data da sessão'),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe('Horário da sessão (HH:MM)'),
    createdAt: z.coerce.date().describe('Data de criação do registro'),
    updatedAt: z.coerce.date().describe('Data da última atualização'),
    movie: z.object({
        id: z.string().uuid(),
        title: z.string(),
        posterUrl: z.string().url(),
        duration: z.number(),
        classification: z.string()
    }).optional().describe('Detalhes do filme'),
    cinema: z.object({
        id: z.string().uuid(),
        name: z.string(),
        address: z.string()
    }).optional().describe('Detalhes do cinema'),
    room: z.object({
        id: z.string().uuid(),
        name: z.string(),
        rows: z.number(),
        seatsPerRow: z.number()
    }).optional().describe('Detalhes da sala')
}).describe('Modelo de sessão');

export const seatSchema = z.object({
    id: z.string().uuid().describe('ID único do assento'),
    sessionId: z.string().uuid().describe('ID da sessão'),
    row: z.string().length(1).describe('Fileira do assento (A-Z)'),
    number: z.number().int().positive().describe('Número do asseto na fileira'),
    status: z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED']).describe('Status do assento'),
    reservation: z.string().uuid().optional().describe('ID da reserva, se aplicável'),
    createdAt: z.coerce.date().describe('Data de criação do registro'),
    updatedAt: z.coerce.date().describe('Data da última atualização')
}).describe('Modelo de assento');

export const seatListSchema = z.array(seatSchema).describe('Lista de assentos');

export const reserveSeatsInputSchema = z.object({
    seats: z.array(z.object({
        row: z.string().length(1).describe('Fileira do assento (A-Z)'),
        number: z.number().int().positive().describe('Número do assento na fileira')
    })).min(1).describe('Assentos a serem reservados'),
    ticketTypes: z.array(z.object({
        type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']).describe('Tipo de ingresso'),
        count: z.number().int().positive().describe('Quantidade deste tipo')
    })).min(1).describe('Tipos de ingressos')
}).describe('Dados para reserva de assentos');

export const reserveSeatsResponseSchema = z.object({
    reservationId: z.string().uuid().describe('ID da reserva'),
    expiresAt: z.coerce.date().describe('Data de expiração da reserva'),
}).describe('Resposta de reserva de assentos');

export const sessionSchemas = [
    { $id: 'Session', schema: sessionSchema },
    { $id: 'Seat', schema: seatSchema },
    { $id: 'SeatList', schema: seatListSchema },
    { $id: 'ReserveSeatsInput', schema: reserveSeatsInputSchema },
    { $id: 'ReserveSeatsResponse', schema: reserveSeatsResponseSchema },
];
