import type { FastifyInstance } from 'fastify';
import { AddPointsSchema } from '@kids-games/shared';
import { getPool } from '../db/client.js';
import * as pointsRepo from '../repositories/points.repository.js';
import * as registry from '../modules/game-registry.js';
import * as gameSession from '../modules/game-session.js';

export async function pointsRoutes(app: FastifyInstance): Promise<void> {
  // GET /points  (auth required)
  app.get(
    '/points',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const row = await pointsRepo.getUserPoints(getPool(), request.user.userId);
      return reply.send({ totalPoints: row?.total_points ?? 0 });
    },
  );

  // POST /points/add  (auth required, client-callable — intentionally insecure for MVP)
  app.post(
    '/points/add',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const body = AddPointsSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: body.error.errors[0]?.message ?? 'Validation error',
        });
      }

      const allowedGame = await registry.getAllowlistedEnabledGameById(body.data.gameId);
      if (!allowedGame) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Game not allowed or not found',
        });
      }

      const sessionToken = request.headers['x-game-session-token'];
      if (typeof sessionToken !== 'string' || sessionToken.length === 0) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Valid game session token is required',
        });
      }

      const sessionClaims = gameSession.verifyGameSessionClaimsOrNull(
        app,
        sessionToken,
      );
      if (!sessionClaims) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid game session token',
        });
      }
      if (sessionClaims.userId !== request.user.userId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Game session does not match authenticated user',
        });
      }
      if (sessionClaims.gameId !== body.data.gameId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Game session game mismatch',
        });
      }
      const requiredScopes =
        allowedGame.required_scopes.length > 0
          ? allowedGame.required_scopes
          : ['points:add'];
      const hasAllRequiredScopes = requiredScopes.every((scope) =>
        gameSession.hasRequiredScope(sessionClaims, scope),
      );
      if (!hasAllRequiredScopes) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Game session is missing required scope',
        });
      }

      const result = await pointsRepo.addPoints(
        getPool(),
        request.user.userId,
        body.data.gameId,
        body.data.points,
      );

      return reply.send(result);
    },
  );
}
