import { z } from 'zod'

export const movieSchema = z.object({
  id: z.string().uuid().describe('ID único do filme'),
  title: z.string().min(1).describe('Título do filme'),
  synopsis: z.string().min(10).describe('Sinopse do filme'),
  posterUrl: z.string().url().describe('URL do pôster do filme'),
  backdropUrl: z.string().url().describe('URL da imagem de fundo do filme'),
  trailerUrl: z.string().url().optional().describe('URL do trailer do filme'),
  duration: z.number().int().positive().describe('Duração do filme em minutos'),
  releaseDate: z.coerce.date().describe('Data de lançamento do filme'),
  classification: z.string().min(1).describe('Classificação indicativa'),
  genres: z.array(z.string().min(1)).min(1).describe('Gêneros do filme'),
  rating: z.number().min(0).max(10).optional().describe('Avaliação média do filme (0-10)'),
  isComingSoon: z.boolean().describe('Se o filme está em breve'),
  createdAt: z.coerce.date().describe('Data de criação do registro'),
  updatedAt: z.coerce.date().describe('Data da última atualização')
}).describe('Modelo do filme')

export const movieListSchema = z.array(movieSchema).describe('Lista de filmes')

export const movieStatusSchema = z.enum(['current', 'coming-soon']).describe('Status do filme (em cartaz ou em breve)')
export type MovieStatus = z.infer<typeof movieStatusSchema>

export const movieQuerySchema = z.object({
  status: movieStatusSchema.optional().describe('Filtro por status do filme'),
  page: z.number().int().positive().optional().default(1).describe('Número da página'),
  limit: z.number().int().positive().max(100).optional().default(10).describe('Limite de itens por página')
}).describe('Parâmetros de consulta para filmes')

export const movieWithSessionsSchema = movieSchema.extend({
  sessions: z.array(z.object({
    id: z.string().uuid(),
    cinema: z.object({
      id: z.string().uuid(),
      name: z.string(),
      address: z.string()
    }),
    room: z.object({
      id: z.string().uuid(),
      name: z.string()
    }),
    date: z.coerce.date(),
    time: z.string()
  }))
}).describe('Filme com sessões disponíveis');

export const movieSchemas = [
  { $id: 'Movie', schema: movieSchema },
  { $id: 'MovieList', schema: movieListSchema },
  { $id: 'MovieStatus', schema: movieStatusSchema },
  { $id: 'MovieQuery', schema: movieQuerySchema },
  { $id: 'MovieWithSessions', schema: movieWithSessionsSchema }
]