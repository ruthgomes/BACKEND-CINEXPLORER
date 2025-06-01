import { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export function handlePrismaError(error: unknown, reply: FastifyReply) {
    if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return reply.status(409).send({
                    message: 'Unique constraint violation',
                    target: error.meta?.target
                });
            case 'P2025':
                return reply.status(404).send({
                    message: 'Record not found',
                    details: error.meta
                });
            default:
                return reply.status(500).send({
                    message: 'Database error',
                    code: error.code,
                    meta: error.meta
                });
        }
    } else if (error instanceof Error) {
        return reply.status(500).send({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
    return reply.status(500).send({ message: 'Internal server error' });
}

export function validateSessionTime(cinemaId: string, roomId: string, dateTime: Date) {
    // real implementation would check for conflicts with other sessions
    return Promise.resolve(true)
}

export function generatePromoCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}