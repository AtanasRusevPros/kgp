/**
 * Integration tests for /games routes.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
const DEFAULT_ALLOWED_GAME_IDS = 'flashcards,tic-tac-toe,snake-classic';
const ORIGINAL_ALLOWED_GAME_IDS = process.env['ALLOWED_GAME_IDS'];

beforeAll(async () => {
  process.env['ALLOWED_GAME_IDS'] = DEFAULT_ALLOWED_GAME_IDS;
  vi.resetModules();

  const { createApp } = await import('../app.js');
  const { testConfig } = await import('../config.js');
  app = await createApp({ logger: false, databaseUrl: testConfig.databaseUrl });
});

afterAll(async () => {
  await app.close();
  vi.resetModules();
  if (ORIGINAL_ALLOWED_GAME_IDS === undefined) {
    delete process.env['ALLOWED_GAME_IDS'];
    return;
  }

  process.env['ALLOWED_GAME_IDS'] = ORIGINAL_ALLOWED_GAME_IDS;
});

describe('GET /games', () => {
  it('returns a list of enabled games', async () => {
    const res = await app.inject({ method: 'GET', url: '/games' });
    expect(res.statusCode).toBe(200);
    const games = res.json<Array<{ id: string; title: string; status: string }>>();
    expect(Array.isArray(games)).toBe(true);
    expect(games.length).toBeGreaterThan(0);
    expect(games.every((g) => g.status === 'enabled')).toBe(true);
  });

  it('each game has required fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/games' });
    const games = res.json<
      Array<{
        id: string;
        title: string;
        iconEmoji: string;
        routeBase: string;
        integrationMode: string;
        clientTargets: string[];
        capabilities: string[];
        apiVersion: string;
        authPolicy: {
          requiresUserAuth: boolean;
          requiresAppIdentity: boolean;
          requiredScopes: string[];
          tokenAudience: string;
        };
      }>
    >();
    for (const game of games) {
      expect(game.id).toBeTruthy();
      expect(game.title).toBeTruthy();
      expect(game.routeBase).toBeTruthy();
      expect(['local', 'external']).toContain(game.integrationMode);
      expect(Array.isArray(game.clientTargets)).toBe(true);
      expect(Array.isArray(game.capabilities)).toBe(true);
      expect(game.apiVersion).toBeTruthy();
      expect(game.authPolicy).toBeTruthy();
      expect(typeof game.authPolicy.requiresUserAuth).toBe('boolean');
      expect(typeof game.authPolicy.requiresAppIdentity).toBe('boolean');
      expect(Array.isArray(game.authPolicy.requiredScopes)).toBe(true);
      expect(game.authPolicy.tokenAudience).toBeTruthy();
    }
  });
});

describe('GET /games/:gameId', () => {
  it('returns a single game by id', async () => {
    const res = await app.inject({ method: 'GET', url: '/games/flashcards' });
    expect(res.statusCode).toBe(200);
    const game = res.json<{ id: string; title: string; routeBase: string }>();
    expect(game.id).toBe('flashcards');
    expect(game.title).toBeTruthy();
    expect(game.routeBase).toBe('/flashcards');
  });

  it('returns flashcards auth policy aligned with delegated points flow', async () => {
    const res = await app.inject({ method: 'GET', url: '/games/flashcards' });
    expect(res.statusCode).toBe(200);
    const game = res.json<{
      authPolicy: {
        requiresUserAuth: boolean;
        requiresAppIdentity: boolean;
        requiredScopes: string[];
        tokenAudience: string;
      };
    }>();
    expect(game.authPolicy).toEqual({
      requiresUserAuth: true,
      requiresAppIdentity: true,
      requiredScopes: ['points:add'],
      tokenAudience: 'game:flashcards',
    });
  });

  it('returns tic-tac-toe as a local web-only game', async () => {
    const res = await app.inject({ method: 'GET', url: '/games/tic-tac-toe' });
    expect(res.statusCode).toBe(200);
    const game = res.json<{
      id: string;
      routeBase: string;
      capabilities: string[];
      authPolicy: {
        requiresUserAuth: boolean;
        requiresAppIdentity: boolean;
        requiredScopes: string[];
        tokenAudience: string;
      };
    }>();
    expect(game.id).toBe('tic-tac-toe');
    expect(game.routeBase).toBe('/tic-tac-toe');
    expect(game.capabilities).toEqual(['local-play']);
    expect(game.authPolicy).toEqual({
      requiresUserAuth: true,
      requiresAppIdentity: false,
      requiredScopes: [],
      tokenAudience: 'kids-games-api',
    });
  });

  it('returns snake-classic as a local web-only game with score persistence metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/games/snake-classic' });
    expect(res.statusCode).toBe(200);
    const game = res.json<{
      id: string;
      routeBase: string;
      capabilities: string[];
      authPolicy: {
        requiresUserAuth: boolean;
        requiresAppIdentity: boolean;
        requiredScopes: string[];
        tokenAudience: string;
      };
    }>();
    expect(game.id).toBe('snake-classic');
    expect(game.routeBase).toBe('/snake-classic');
    expect(game.capabilities).toEqual(['local-play', 'high-score']);
    expect(game.authPolicy).toEqual({
      requiresUserAuth: true,
      requiresAppIdentity: false,
      requiredScopes: [],
      tokenAudience: 'kids-games-api',
    });
  });

  it('returns 404 for unknown game', async () => {
    const res = await app.inject({ method: 'GET', url: '/games/unknown-game' });
    expect(res.statusCode).toBe(404);
  });
});
