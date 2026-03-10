import type { FastifyInstance } from 'fastify';
import { mapGame } from '../mappers.js';
import * as registry from '../modules/game-registry.js';

export async function gameRoutes(app: FastifyInstance): Promise<void> {
  // GET /games
  app.get('/games', async (_request, reply) => {
    const games = await registry.getAllowlistedEnabledGames();
    return reply.send(games.map(mapGame));
  });

  // GET /games/:gameId
  app.get<{ Params: { gameId: string } }>(
    '/games/:gameId',
    async (request, reply) => {
      const game = await registry.getAllowlistedEnabledGameById(request.params.gameId);
      if (!game) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Game not found',
        });
      }
      return reply.send(mapGame(game));
    },
  );
}
