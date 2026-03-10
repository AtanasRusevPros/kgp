import type { FastifyInstance } from 'fastify';
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  GameSessionSchema,
} from '@kids-games/shared';
import * as authService from '../services/auth.service.js';
import { config } from '../config.js';
import * as registry from '../modules/game-registry.js';
import * as appClientAuth from '../modules/app-client-auth.js';
import * as gameSession from '../modules/game-session.js';

const AUTH_RATE_LIMIT = { max: 10, timeWindow: '1 minute' };

function signUserAccessToken(app: FastifyInstance, userId: string, email: string): string {
  return app.jwt.sign(
    {
      userId,
      email,
      typ: 'user_access',
      aud: 'kids-games-api',
      scope: [],
    },
    { expiresIn: config.jwtExpiresIn },
  );
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/register
  app.post(
    '/auth/register',
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      const body = RegisterSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: body.error.errors[0]?.message ?? 'Validation error',
        });
      }

      try {
        const user = await authService.registerUser(
          body.data.email,
          body.data.password,
          body.data.displayName,
        );

        const accessToken = signUserAccessToken(app, user.id, user.email);
        const refreshToken = authService.generateRefreshToken();
        await authService.persistRefreshToken(user.id, refreshToken);

        return reply.status(201).send({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
          },
        });
      } catch (err) {
        if (err instanceof authService.AuthError && err.code === 'EMAIL_TAKEN') {
          return reply
            .status(409)
            .send({ statusCode: 409, error: 'Conflict', message: err.message });
        }
        throw err;
      }
    },
  );

  // POST /auth/login
  app.post(
    '/auth/login',
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      const body = LoginSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: body.error.errors[0]?.message ?? 'Validation error',
        });
      }

      try {
        const user = await authService.validateCredentials(
          body.data.email,
          body.data.password,
        );

        const accessToken = signUserAccessToken(app, user.id, user.email);
        const refreshToken = authService.generateRefreshToken();
        await authService.persistRefreshToken(user.id, refreshToken);

        return reply.send({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
          },
        });
      } catch (err) {
        if (
          err instanceof authService.AuthError &&
          err.code === 'INVALID_CREDENTIALS'
        ) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  // POST /auth/refresh
  app.post('/auth/refresh', async (request, reply) => {
    const body = RefreshSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.errors[0]?.message ?? 'Validation error',
      });
    }

    try {
      const { userId, newRefreshToken } = await authService.rotateRefreshToken(
        body.data.refreshToken,
      );

      const user = await authService.getUserById(userId);
      if (!user) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User not found',
        });
      }

      const accessToken = signUserAccessToken(app, user.id, user.email);

      return reply.send({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
      if (
        err instanceof authService.AuthError &&
        err.code === 'INVALID_TOKEN'
      ) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: err.message,
        });
      }
      throw err;
    }
  });

  // POST /auth/logout
  app.post(
    '/auth/logout',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const body = request.body as { refreshToken?: string } | null;
      if (body?.refreshToken) {
        await authService.logout(body.refreshToken);
      }
      return reply.status(204).send();
    },
  );

  // POST /auth/logout-all
  app.post(
    '/auth/logout-all',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      await authService.logoutAll(request.user.userId);
      return reply.status(204).send();
    },
  );

  // GET /auth/me
  app.get(
    '/auth/me',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = await authService.getUserById(request.user.userId);
      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }
      return reply.send({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      });
    },
  );

  // POST /auth/game-session (user auth + app client identity -> delegated token)
  app.post(
    '/auth/game-session',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const body = GameSessionSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: body.error.errors[0]?.message ?? 'Validation error',
        });
      }

      const game = await registry.getAllowlistedEnabledGameById(body.data.gameId);
      if (!game) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Game not allowed or not found',
        });
      }

      const appClient = await appClientAuth.verifyAppClientOrNull(
        request,
        body.data.gameId,
      );
      if (!appClient) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Valid game client credentials are required',
        });
      }

      const requestedScopes = body.data.scopes ?? ['points:add'];
      const token = gameSession.signGameSessionToken(app, {
        userId: request.user.userId,
        email: request.user.email,
        scope: requestedScopes,
        gameId: body.data.gameId,
        clientId: appClient.clientId,
      });

      return reply.send({
        gameSessionToken: token,
        gameId: body.data.gameId,
        scopes: requestedScopes,
        expiresInSeconds: 300,
      });
    },
  );
}
