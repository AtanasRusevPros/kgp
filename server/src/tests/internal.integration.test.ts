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

describe('GET /internal/games/health', () => {
  it('returns allowlist health data', async () => {
    const res = await app.inject({ method: 'GET', url: '/internal/games/health' });
    expect(res.statusCode).toBe(200);

    const body = res.json<{
      allowedGameIds: string[];
      loadedGames: Array<{ id: string; title: string; routeBase: string }>;
      missingAllowedGameIds: string[];
      loadedAdapterGameIds: string[];
      missingAdapterGameIds: string[];
      duplicateAdapterGameIds: string[];
    }>();

    expect(Array.isArray(body.allowedGameIds)).toBe(true);
    expect(Array.isArray(body.loadedGames)).toBe(true);
    expect(Array.isArray(body.missingAllowedGameIds)).toBe(true);
    expect(Array.isArray(body.loadedAdapterGameIds)).toBe(true);
    expect(Array.isArray(body.missingAdapterGameIds)).toBe(true);
    expect(Array.isArray(body.duplicateAdapterGameIds)).toBe(true);
    expect(body.allowedGameIds).toEqual(['flashcards', 'tic-tac-toe', 'snake-classic']);
    expect(body.loadedGames).toContainEqual({
      id: 'flashcards',
      title: 'Flash Cards',
      routeBase: '/flashcards',
    });
    expect(body.loadedGames).toContainEqual({
      id: 'tic-tac-toe',
      title: 'Tic-Tac-Toe',
      routeBase: '/tic-tac-toe',
    });
    expect(body.loadedGames).toContainEqual({
      id: 'snake-classic',
      title: 'Snake Classic',
      routeBase: '/snake-classic',
    });
    expect(body.loadedAdapterGameIds).toEqual(['flashcards', 'snake-classic', 'tic-tac-toe']);
    expect(body.missingAdapterGameIds).toEqual([]);
    expect(body.duplicateAdapterGameIds).toEqual([]);
  });
});
