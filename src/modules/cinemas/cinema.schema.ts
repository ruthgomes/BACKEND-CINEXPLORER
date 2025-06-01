import { z } from "zod";

export const cinemaSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }),
    createdAt: z.date(),
    updatedAt: z.date()
})

export const cinemaListSchema = z.array(cinemaSchema);

export type CinemaQuery = z.infer<typeof cinemaQuerySchema>;
export const cinemaQuerySchema = z.object({
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    sort: z.enum(['distance', 'name']).optional()
})

export const roomSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    rows: z.number().int().positive(),
    seatsPerRow: z.number().int().positive(),
    createdAt: z.date(),
    updatedAt: z.date()
})

export const roomListSchema = z.array(roomSchema);

export const cinemaSchemas = [
    { $id: 'Cinema', schema: cinemaSchema },
    { $id: 'CinemaList', schema: cinemaListSchema },
    { $id: 'CinemaQuery', schema: cinemaQuerySchema },
    { $id: 'Room', schema: roomSchema },
    { $id: 'RoomList', schema: roomListSchema },
]