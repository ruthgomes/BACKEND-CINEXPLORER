import { z } from 'zod';

export const sessionSchema = z.object({
    id: z.string().uuid(),
    movieId: z.string().uuid(),
    cinemaId: z.string().uuid(),
    roomId: z.string().uuid(),
    date: z.date(),
    time: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
})

export const seatSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    row: z.string(),
    number: z.number(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED']),
    reservation: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
})

export const seatListSchema = z.array(seatSchema);

export const reserveSeatsInputSchema = z.object({
    seats: z.array(z.object({
        row: z.string(),
        number: z.number()
    })),
    ticketTypes: z.array(z.object({
        type: z.enum(['ADULT', 'CHILD', 'SENIOR', 'STUDENT']),
        count: z.number().int().positive()
    }))
})

export const reserveSeatsResponseSchema = z.object({
    reservationId: z.string().uuid(),
    expiresAt: z.date(),
})

export const sessionSchemas = [
    { $id: 'Session', schema: sessionSchema },
    { $id: 'Seat', schema: seatSchema },
    { $id: 'SeatList', schema: seatListSchema },
    { $id: 'ReserveSeatsInput', schema: reserveSeatsInputSchema },
    { $id: 'ReserveSeatsResponse', schema: reserveSeatsResponseSchema },
]