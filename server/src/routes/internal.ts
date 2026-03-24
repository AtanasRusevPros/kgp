import type { FastifyInstance } from 'fastify';
import * as registry from '../modules/game-registry.js';

export async function internalRoutes(app: FastifyInstance): Promise<void> {
  // GET /internal/games/health
  app.get('/internal/games/health', async (_request, reply) => {
    const health = await registry.getRegistryHealth();
    return reply.send(health);
  });
}
