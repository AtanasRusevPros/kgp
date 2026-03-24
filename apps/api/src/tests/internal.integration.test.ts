import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';
import { testConfig } from '../config.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createApp({ logger: false, databaseUrl: testConfig.databaseUrl });
});

afterAll(async () => {
  await app.close();
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
    expect(body.allowedGameIds).toContain('flashcards');
    expect(body.loadedGames.some((game) => game.id === 'flashcards')).toBe(true);
    expect(body.loadedAdapterGameIds).toContain('flashcards');
    expect(body.missingAdapterGameIds).toEqual([]);
    expect(body.duplicateAdapterGameIds).toEqual([]);
  });
});
