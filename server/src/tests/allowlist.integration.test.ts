import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const DEFAULT_ALLOWED_GAME_IDS = 'flashcards,tic-tac-toe';

async function createIsolatedAppWithAllowlist(allowedGameIds: string): Promise<FastifyInstance> {
  const originalAllowedGameIds = process.env['ALLOWED_GAME_IDS'];
  process.env['ALLOWED_GAME_IDS'] = allowedGameIds;

  vi.resetModules();

  try {
    const { createApp } = await import('../app.js');
    const databaseUrl = process.env['TEST_DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for allowlist integration tests');
    }
    return await createApp({ logger: false, databaseUrl });
  } catch (error) {
    if (originalAllowedGameIds === undefined) {
      delete process.env['ALLOWED_GAME_IDS'];
    } else {
      process.env['ALLOWED_GAME_IDS'] = originalAllowedGameIds;
    }
    throw error;
  }
}

afterEach(() => {
  vi.resetModules();
  process.env['ALLOWED_GAME_IDS'] = DEFAULT_ALLOWED_GAME_IDS;
});

describe('allowlist-controlled runtime blocking', () => {
  it('blocks seeded games from /games and /games/:gameId when they are not allowlisted', async () => {
    const app = await createIsolatedAppWithAllowlist('');

    try {
      const listRes = await app.inject({ method: 'GET', url: '/games' });
      expect(listRes.statusCode).toBe(200);
      expect(listRes.json()).toEqual([]);

      const detailRes = await app.inject({ method: 'GET', url: '/games/flashcards' });
      expect(detailRes.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('reports missing allowlisted game IDs in internal registry health', async () => {
    const app = await createIsolatedAppWithAllowlist('flashcards,word-match');

    try {
      const res = await app.inject({ method: 'GET', url: '/internal/games/health' });
      expect(res.statusCode).toBe(200);

      const body = res.json<{
        allowedGameIds: string[];
        loadedAdapterGameIds: string[];
        missingAllowedGameIds: string[];
        missingAdapterGameIds: string[];
      }>();

      expect(body.allowedGameIds).toEqual(['flashcards', 'word-match']);
      expect(body.loadedAdapterGameIds).toEqual(['flashcards']);
      expect(body.missingAllowedGameIds).toEqual(['word-match']);
      expect(body.missingAdapterGameIds).toEqual([]);
    } finally {
      await app.close();
    }
  });
});
