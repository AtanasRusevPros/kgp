import type { ReactElement } from 'react';
import { describe, it, expect } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute.js';
import { buildGameRoutes, webGameRegistry } from '../games/registry.js';

describe('web game registry', () => {
  it('contains flashcards, tic-tac-toe, and snake-classic modules with web routes', () => {
    const flashcards = webGameRegistry.find((game) => game.id === 'flashcards');
    const snakeClassic = webGameRegistry.find((game) => game.id === 'snake-classic');
    const ticTacToe = webGameRegistry.find((game) => game.id === 'tic-tac-toe');
    expect(flashcards).toBeTruthy();
    expect(snakeClassic).toBeTruthy();
    expect(ticTacToe).toBeTruthy();
    expect(flashcards?.routeBase).toBe('/flashcards');
    expect(snakeClassic?.routeBase).toBe('/snake-classic');
    expect(ticTacToe?.routeBase).toBe('/tic-tac-toe');
    expect(flashcards?.routes.some((route) => route.path === '/flashcards')).toBe(true);
    expect(
      flashcards?.routes.some((route) => route.path === '/flashcards/:deckId'),
    ).toBe(true);
    expect(snakeClassic?.routes.some((route) => route.path === '/snake-classic')).toBe(true);
    expect(ticTacToe?.routes.some((route) => route.path === '/tic-tac-toe')).toBe(true);
  });

  it('builds route objects from registry entries', () => {
    const routes = buildGameRoutes();
    const paths = routes.map((route) => route.path);
    const snakeRoute = routes.find((route) => route.path === '/snake-classic');

    expect(paths).toContain('/flashcards');
    expect(paths).toContain('/flashcards/:deckId');
    expect(paths).toContain('/snake-classic');
    expect(paths).toContain('/tic-tac-toe');
    expect((snakeRoute?.element as ReactElement | undefined)?.type).toBe(ProtectedRoute);
  });
});
