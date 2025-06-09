import { z } from 'zod';

export const userSchema = z.object({
    id: z.string().uuid().describe('ID único do usuário'),
    name: z.string().describe('Nome completo do usuário'),
    email: z.string().email().describe('Email do usuário'),
    role: z.enum(['USER', 'ADMIN']).describe('Papel do usuário (USER ou ADMIN)'),
    createdAt: z.date().describe('Data de criação do usuário'),
    updatedAt: z.date().describe('Data da última atualização do usuário')
}).describe('Modelo de usuário')

export const loginInputSchema = z.object({
    email: z.string().email().describe('Email do usuário'),
    password: z.string().min(6).describe('Senha do usuário (mínimo 6 caracteres)')
}).required().describe('Dados de login')

export const loginResponseSchema = z.object({
    token: z.string().describe('Token JWT para autenticação'),
    user: userSchema
}).describe('Resposta de login')

export const registerInputSchema = z.object({
    name: z.string().min(3).describe('Nome completo do usuário (mínimo de 3 caracteres)'),
    email: z.string().email().describe('Email do usuário'),
    password: z.string().min(6).describe('Senha do usuário (mínimo 6 caracteres)')
}).describe('Dados de registro')

export const userSchemas = [
    { $id: 'User', schema: userSchema },
    { $id: 'LoginInput', schema: loginInputSchema },
    { $id: 'LoginResponse', schema: loginResponseSchema },
    { $id: 'ReisterInput', schema: registerInputSchema }
]