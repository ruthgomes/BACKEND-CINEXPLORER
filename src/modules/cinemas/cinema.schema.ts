import { z } from "zod";

export const cinemaSchema = z.object({
    id: z.string().uuid().describe('ID único do cinema'),
    name: z.string().min(1).describe('Nome do cinema'),
    address: z.string().min(1).describe('Endereço completo do cinema'),
    location: z.object({
        lat: z.number().min(-90).max(90).describe('Latitude da localização'),
        lng: z.number().min(-180).max(180).describe('Longitude da localização')
    }).describe('Coordenadas geográficas do cinema'),
    createdAt: z.coerce.date().describe('Data de criação do registro'),
    updatedAt: z.coerce.date().describe('Data da última atualização')
}).describe('Modelo de cinema')

export const cinemaListSchema = z.array(cinemaSchema.extend({
    distance: z.number().optional().describe('Distância em km da localização de referência')
})
).describe('Lista de cinemas');

export type CinemaQuery = z.infer<typeof cinemaQuerySchema>;
export const cinemaQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90).optional().describe('Latitude para ordenar por distância'),
    lng: z.coerce.number().min(-180).max(180).optional().describe('Longitude para ordenar por distância'),
    sort: z.enum(['distance', 'name']).optional().describe('Método de ordenação (distância ou nome)')
}).describe('Parâmetros de consulta para cinemas');

export const roomSchema = z.object({
    id: z.string().uuid().describe('ID único de sala'),
    name: z.string().min(1).describe('Nome da sala'),
    rows: z.number().int().positive().describe('Número de fileiras na sala'),
    seatsPerRow: z.number().int().positive().describe('Número de assentos por fileira'),
    createdAt: z.coerce.date().describe('Data de criação do registro'),
    updatedAt: z.coerce.date().describe('Data da última atualização')
}).describe('Modelo de sala de cinema');

export const roomListSchema = z.array(roomSchema).describe('Lista de salas');

export const cinemaSchemas = [
    { $id: 'Cinema', schema: cinemaSchema },
    { $id: 'CinemaList', schema: cinemaListSchema },
    { $id: 'CinemaQuery', schema: cinemaQuerySchema },
    { $id: 'Room', schema: roomSchema },
    { $id: 'RoomList', schema: roomListSchema },
]