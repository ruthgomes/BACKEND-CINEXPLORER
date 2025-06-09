import { z } from 'zod';
import { movieSchema } from '../movies/movie.schema';
import { cinemaSchema } from '../cinemas/cinema.schema';
import { sessionSchema } from '../sessions/session.schema';
import { roomSchema } from '../cinemas/cinema.schema';
import { describe } from 'node:test';

export const createMovieInputSchema = movieSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
}).describe('Dados para criação de filme');

export const updateMovieInputSchema = createMovieInputSchema.partial().describe('Dados para atualização de filme');

export const createCinemaInputSchema = cinemaSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).describe('Dados para criação de cinema');

export const updateCinemaInputSchema = createCinemaInputSchema.partial().describe('Dados para atualização de cinema');

export const createRoomInputSchema = z.object({
    name: z.string().min(1).max(50).describe('Nome da sala'),
    cinemaId: z.string().uuid().describe('ID do cinema'),
    rows: z.number().int().min(1).max(26).describe('Número de fileiras (1-26)'), // Limit to 26 rows (A-Z)
    seatsPerRow: z.number().int().min(1).max(50).describe('Número de assentos por fileira (1-50)') // Max 50 seats per row
}).describe('Dados para atualização de sala');

export const updateRoomInputSchema = createRoomInputSchema.partial().describe('Dados para atualização de sala');

export const createSessionInputSchema = z.object({
    movieId: z.string().uuid().describe('ID do filme'),
    cinemaId: z.string().uuid().describe('ID do cinema'),
    roomId: z.string().uuid().describe('ID da sala'),
    date: z.string().datetime().describe('Data da sessão (ISO 8601)'),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe('Horário de sessão (HH:MM)')
}).describe('Dados para criação de sessão');

export const adminSchemas = [
    { $id: 'CreateMovieInput', schema: createMovieInputSchema },
    { $id: 'UpdateMovieInput', schema: updateMovieInputSchema },
    { $id: 'CreateCinemaInput', schema: createCinemaInputSchema },
    { $id: 'UpdateCinemaInput', schema: updateCinemaInputSchema },
    { $id: 'CreateRoomInput', schema: createRoomInputSchema },
    { $id: 'UpdateRoomInput', schema: updateRoomInputSchema },
    { $id: 'CreateSessionInput', schema: createSessionInputSchema }
]