import { config } from '../config.js';
import { getPool } from '../db/client.js';
import * as gameRepo from '../repositories/game.repository.js';
import { resolveBackendAdapterLoadPlan } from './game-adapter-loader.js';

export interface RegistryHealth {
  allowedGameIds: string[];
  loadedGames: Array<{ id: string; title: string; routeBase: string }>;
  missingAllowedGameIds: string[];
  loadedAdapterGameIds: string[];
  missingAdapterGameIds: string[];
  duplicateAdapterGameIds: string[];
}

export function isGameAllowedByConfig(gameId: string): boolean {
  return config.allowedGameIds.includes(gameId);
}

export async function getAllowlistedEnabledGames() {
  return gameRepo.findEnabledGamesByIds(getPool(), config.allowedGameIds);
}

export async function getAllowlistedEnabledGameById(gameId: string) {
  if (!isGameAllowedByConfig(gameId)) return null;
  return gameRepo.findEnabledGameById(getPool(), gameId);
}

export async function getRegistryHealth(): Promise<RegistryHealth> {
  const games = await getAllowlistedEnabledGames();
  const loadedIds = new Set(games.map((g) => g.id));
  const adapterPlan = resolveBackendAdapterLoadPlan(games);

  return {
    allowedGameIds: [...config.allowedGameIds],
    loadedGames: games.map((game) => ({
      id: game.id,
      title: game.title,
      routeBase: game.route_base,
    })),
    missingAllowedGameIds: config.allowedGameIds.filter((id) => !loadedIds.has(id)),
    loadedAdapterGameIds: adapterPlan.adaptersToLoad.map((adapter) => adapter.gameId),
    missingAdapterGameIds: adapterPlan.missingAdapterGameIds,
    duplicateAdapterGameIds: adapterPlan.duplicateAdapterGameIds,
  };
}
