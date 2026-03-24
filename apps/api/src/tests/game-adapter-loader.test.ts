import { describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  registerAllowlistedBackendAdapters,
  resolveBackendAdapterLoadPlan,
  type BackendGameAdapter,
} from '../modules/game-adapter-loader.js';

describe('resolveBackendAdapterLoadPlan', () => {
  it('returns adapters for allowlisted enabled games with matching handlers', () => {
    const plan = resolveBackendAdapterLoadPlan(
      [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
      [
        {
          gameId: 'flashcards',
          register: vi.fn(),
        },
      ],
    );

    expect(plan.missingAdapterGameIds).toEqual([]);
    expect(plan.duplicateAdapterGameIds).toEqual([]);
    expect(plan.adaptersToLoad.map((adapter) => adapter.gameId)).toEqual(['flashcards']);
  });

  it('reports missing adapters for allowlisted enabled games', () => {
    const plan = resolveBackendAdapterLoadPlan(
      [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
      [],
    );

    expect(plan.adaptersToLoad).toEqual([]);
    expect(plan.missingAdapterGameIds).toEqual(['flashcards']);
  });

  it('reports duplicate adapter registrations', () => {
    const adapter: BackendGameAdapter = {
      gameId: 'flashcards',
      register: vi.fn(),
    };

    const plan = resolveBackendAdapterLoadPlan(
      [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
      [adapter, adapter],
    );

    expect(plan.duplicateAdapterGameIds).toEqual(['flashcards']);
  });
});

describe('registerAllowlistedBackendAdapters', () => {
  it('registers resolved adapters', async () => {
    const register = vi.fn().mockResolvedValue(undefined);

    await registerAllowlistedBackendAdapters(
      {} as FastifyInstance,
      [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
      [{ gameId: 'flashcards', register }],
    );

    expect(register).toHaveBeenCalledTimes(1);
  });

  it('throws when an allowlisted enabled game has no adapter', async () => {
    await expect(
      registerAllowlistedBackendAdapters(
        {} as FastifyInstance,
        [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
        [],
      ),
    ).rejects.toThrow('Missing backend adapters for allowlisted enabled game IDs: flashcards');
  });
});
