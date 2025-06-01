import { z } from 'zod'

export const movieSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  synopsis: z.string(),
  posterUrl: z.string().url(),
  backdropUrl: z.string().url(),
  trailerUrl: z.string().url().optional(),
  duration: z.number().int().positive(),
  releaseDate: z.date(),
  classification: z.string(),
  genres: z.array(z.string()),
  rating: z.number().min(0).max(10).optional(),
  isComingSoon: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export const movieListSchema = z.array(movieSchema)

export const movieStatusSchema = z.enum(['current', 'coming-soon'])
export type MovieStatus = z.infer<typeof movieStatusSchema>

export const movieQuerySchema = z.object({
  status: movieStatusSchema.optional()
})

export const movieSchemas = [
  { $id: 'Movie', schema: movieSchema },
  { $id: 'MovieList', schema: movieListSchema },
  { $id: 'MovieStatus', schema: movieStatusSchema },
  { $id: 'MovieQuery', schema: movieQuerySchema }
]