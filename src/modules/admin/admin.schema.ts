import { z } from 'zod';
import { movieSchema } from '../movies/movie.schema';
import { cinemaSchema } from '../cinemas/cinema.schema';
import { sessionSchema } from '../sessions/session.schema';
import { roomSchema } from '../cinemas/cinema.schema';

export const createMovieInputSchema = movieSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
})
export const updateMovieInputSchema = createMovieInputSchema.partial()

export const createCinemaInputSchema = cinemaSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
})
export const updateCinemaInputSchema = createCinemaInputSchema.partial()

export const createRoomInputSchema = z.object({
    name: z.string().min(1),
    cinemaId: z.string().uuid(),
    rows: z.number().int().min(1).max(26), // Limit to 26 rows (A-Z)
    seatsPerRow: z.number().int().min(1).max(50) // Max 50 seats per row
})

export const updateRoomInputSchema = createRoomInputSchema.partial()

export const createSessionInputSchema = z.object({
    movieId: z.string().uuid(),
    cinemaId: z.string().uuid(),
    roomId: z.string().uuid(),
    date: z.string().datetime(),
    time: z.string()
})

export const adminSchemas = [
    { $id: 'CreateMovieInput', schema: createMovieInputSchema },
    { $id: 'UpdateMovieInput', schema: updateMovieInputSchema },
    { $id: 'CreateCinemaInput', schema: createCinemaInputSchema },
    { $id: 'UpdateCinemaInput', schema: updateCinemaInputSchema },
    { $id: 'CreateRoomInput', schema: createRoomInputSchema },
    { $id: 'UpdateRoomInput', schema: updateRoomInputSchema },
    { $id: 'CreateSessionInput', schema: createSessionInputSchema }
]