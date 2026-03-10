import { describe, it, expect } from 'vitest';
import { buildGameRoutes, webGameRegistry } from '../games/registry.js';

describe('web game registry', () => {
  it('contains flashcards module with web routes', () => {
    const flashcards = webGameRegistry.find((game) => game.id === 'flashcards');
    expect(flashcards).toBeTruthy();
    expect(flashcards?.routeBase).toBe('/flashcards');
    expect(flashcards?.routes.some((route) => route.path === '/flashcards')).toBe(true);
    expect(
      flashcards?.routes.some((route) => route.path === '/flashcards/:deckId'),
    ).toBe(true);
  });

  it('builds route objects from registry entries', () => {
    const routes = buildGameRoutes();
    const paths = routes.map((route) => route.path);
    expect(paths).toContain('/flashcards');
    expect(paths).toContain('/flashcards/:deckId');
  });
});
