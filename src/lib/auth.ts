import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.status(401).send({ message: 'Unauthorized' });
    }
}

export function setupAuth(app: FastifyInstance) {
    app.decorate('authenticate', authenticate);
}