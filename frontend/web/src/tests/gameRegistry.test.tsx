import { describe, it, expect } from 'vitest';
import { buildGameRoutes, webGameRegistry } from '../games/registry.js';

describe('web game registry', () => {
  it('contains flashcards and tic-tac-toe modules with web routes', () => {
    const flashcards = webGameRegistry.find((game) => game.id === 'flashcards');
    const ticTacToe = webGameRegistry.find((game) => game.id === 'tic-tac-toe');
    expect(flashcards).toBeTruthy();
    expect(ticTacToe).toBeTruthy();
    expect(flashcards?.routeBase).toBe('/flashcards');
    expect(ticTacToe?.routeBase).toBe('/tic-tac-toe');
    expect(flashcards?.routes.some((route) => route.path === '/flashcards')).toBe(true);
    expect(
      flashcards?.routes.some((route) => route.path === '/flashcards/:deckId'),
    ).toBe(true);
    expect(ticTacToe?.routes.some((route) => route.path === '/tic-tac-toe')).toBe(true);
  });

  it('builds route objects from registry entries', () => {
    const routes = buildGameRoutes();
    const paths = routes.map((route) => route.path);
    expect(paths).toContain('/flashcards');
    expect(paths).toContain('/flashcards/:deckId');
    expect(paths).toContain('/tic-tac-toe');
  });
});
