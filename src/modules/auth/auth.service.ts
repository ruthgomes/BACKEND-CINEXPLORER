import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { FastifyRequest } from 'fastify';
import { User } from '../../../generated/prisma'; 

export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
}

export async function createUser(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    return prisma.user.create({
        data: {
            ...data,
            password: hashedPassword
        }
    })
}

export async function verifyPassword(user: User, password: string) {
    return bcrypt.compare(password, user.password)
}

export async function getCurrentUser(request: FastifyRequest) {
    await request.jwtVerify()
    const user = await prisma.user.findUnique({
        where: { id: (request.user as { sub: string }).sub }
    })
    return user
}