import { z } from 'zod';

export const userSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['USER', 'ADMIN']),
    createdAt: z.date(),
    updatedAt: z.date()
})

export const loginInputSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
}).required()

export const loginResponseSchema = z.object({
    token: z.string(),
    user: userSchema
})

export const registerInputSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6)
})

export const userSchemas = [
    { $id: 'User', schema: userSchema },
    { $id: 'LoginInput', schema: loginInputSchema },
    { $id: 'LoginResponse', schema: loginResponseSchema },
    { $id: 'ReisterInput', schema: registerInputSchema }
]