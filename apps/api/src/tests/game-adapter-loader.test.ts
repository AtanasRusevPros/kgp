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

  it('loads only adapters for allowlisted enabled games and preserves game order', () => {
    const flashcardsAdapter: BackendGameAdapter = {
      gameId: 'flashcards',
      register: vi.fn(),
    };
    const spellingBeeAdapter: BackendGameAdapter = {
      gameId: 'spelling-bee',
      register: vi.fn(),
    };
    const unusedAdapter: BackendGameAdapter = {
      gameId: 'word-match',
      register: vi.fn(),
    };

    const plan = resolveBackendAdapterLoadPlan(
      [
        { id: 'spelling-bee', title: 'Spelling Bee', route_base: '/spelling-bee' },
        { id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' },
      ],
      [unusedAdapter, flashcardsAdapter, spellingBeeAdapter],
    );

    expect(plan.adaptersToLoad.map((adapter) => adapter.gameId)).toEqual([
      'spelling-bee',
      'flashcards',
    ]);
    expect(plan.missingAdapterGameIds).toEqual([]);
    expect(plan.duplicateAdapterGameIds).toEqual([]);
  });

  it('reports both duplicate and missing adapters in the same plan', () => {
    const flashcardsAdapter: BackendGameAdapter = {
      gameId: 'flashcards',
      register: vi.fn(),
    };

    const plan = resolveBackendAdapterLoadPlan(
      [
        { id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' },
        { id: 'spelling-bee', title: 'Spelling Bee', route_base: '/spelling-bee' },
      ],
      [flashcardsAdapter, { ...flashcardsAdapter }],
    );

    expect(plan.adaptersToLoad.map((adapter) => adapter.gameId)).toEqual(['flashcards']);
    expect(plan.duplicateAdapterGameIds).toEqual(['flashcards']);
    expect(plan.missingAdapterGameIds).toEqual(['spelling-bee']);
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

  it('throws when duplicate adapters are configured for an allowlisted game', async () => {
    const adapter: BackendGameAdapter = {
      gameId: 'flashcards',
      register: vi.fn(),
    };

    await expect(
      registerAllowlistedBackendAdapters(
        {} as FastifyInstance,
        [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
        [adapter, { ...adapter }],
      ),
    ).rejects.toThrow('Duplicate backend adapters configured for game IDs: flashcards');
  });

  it('propagates adapter registration failures', async () => {
    const register = vi.fn().mockRejectedValue(new Error('adapter registration failed'));

    await expect(
      registerAllowlistedBackendAdapters(
        {} as FastifyInstance,
        [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
        [{ gameId: 'flashcards', register }],
      ),
    ).rejects.toThrow('adapter registration failed');

    expect(register).toHaveBeenCalledTimes(1);
  });
});
