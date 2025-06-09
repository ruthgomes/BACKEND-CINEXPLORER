import { 
  FastifyInstance, 
  FastifyBaseLogger, 
  RawServerDefault, 
  RawRequestDefaultExpression, 
  RawReplyDefaultExpression
} from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export type FastifyTypedInstance = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyBaseLogger,
    ZodTypeProvider
>;

declare module '@fastify/jwt' {
    interface FastifyRequest {
        user: {
            sub: string,
            role: 'USER' | 'ADMIN';
        };
    }
}