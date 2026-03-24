import type { FastifyInstance } from 'fastify';
import { flashcardsBackendAdapter } from '../routes/flashcards.js';

export interface AllowlistedEnabledGame {
  id: string;
  title: string;
  route_base: string;
}

export interface BackendGameAdapter {
  gameId: string;
  register(app: FastifyInstance): Promise<void>;
}

export interface ResolvedAdapterLoadPlan {
  adaptersToLoad: BackendGameAdapter[];
  duplicateAdapterGameIds: string[];
  missingAdapterGameIds: string[];
}

const DEFAULT_BACKEND_GAME_ADAPTERS: BackendGameAdapter[] = [flashcardsBackendAdapter];

export function resolveBackendAdapterLoadPlan(
  games: AllowlistedEnabledGame[],
  adapters: BackendGameAdapter[] = DEFAULT_BACKEND_GAME_ADAPTERS,
): ResolvedAdapterLoadPlan {
  const adapterMap = new Map<string, BackendGameAdapter>();
  const duplicateAdapterGameIds = new Set<string>();

  for (const adapter of adapters) {
    if (adapterMap.has(adapter.gameId)) {
      duplicateAdapterGameIds.add(adapter.gameId);
      continue;
    }
    adapterMap.set(adapter.gameId, adapter);
  }

  const missingAdapterGameIds: string[] = [];
  const adaptersToLoad: BackendGameAdapter[] = [];

  for (const game of games) {
    const adapter = adapterMap.get(game.id);
    if (!adapter) {
      missingAdapterGameIds.push(game.id);
      continue;
    }
    adaptersToLoad.push(adapter);
  }

  return {
    adaptersToLoad,
    duplicateAdapterGameIds: [...duplicateAdapterGameIds].sort(),
    missingAdapterGameIds,
  };
}

export async function registerAllowlistedBackendAdapters(
  app: FastifyInstance,
  games: AllowlistedEnabledGame[],
  adapters: BackendGameAdapter[] = DEFAULT_BACKEND_GAME_ADAPTERS,
): Promise<void> {
  const plan = resolveBackendAdapterLoadPlan(games, adapters);

  if (plan.duplicateAdapterGameIds.length > 0) {
    throw new Error(
      `Duplicate backend adapters configured for game IDs: ${plan.duplicateAdapterGameIds.join(', ')}`,
    );
  }

  if (plan.missingAdapterGameIds.length > 0) {
    throw new Error(
      `Missing backend adapters for allowlisted enabled game IDs: ${plan.missingAdapterGameIds.join(', ')}`,
    );
  }

  for (const adapter of plan.adaptersToLoad) {
    await adapter.register(app);
  }
}
