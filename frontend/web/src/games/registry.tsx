import type { RouteObject } from 'react-router-dom';
import type { WebGameModule } from './types.js';
import { buildRoutesFromModules } from './types.js';
import { flashcardsWebManifest } from '../../../../games/flashcards/web/src/module.js';
import { snakeClassicWebManifest } from '../../../../games/snake-classic/web/src/module.js';
import { ticTacToeWebManifest } from '../../../../games/tic-tac-toe/web/src/module.js';
import { DeckPickerPage } from '../pages/flashcards/DeckPickerPage.js';
import { FlashcardGamePage } from '../pages/flashcards/FlashcardGamePage.js';
import { SnakeClassicPage } from '../pages/snakeClassic/SnakeClassicPage.js';
import { TicTacToePage } from '../pages/ticTacToe/TicTacToePage.js';

const routeElementById = {
  'flashcards.deck-picker': <DeckPickerPage />,
  'flashcards.game': <FlashcardGamePage />,
  'snake-classic.board': <SnakeClassicPage />,
  'tic-tac-toe.board': <TicTacToePage />,
} as const;

const flashcardsWebModule: WebGameModule = {
  id: flashcardsWebManifest.id,
  routeBase: flashcardsWebManifest.routeBase,
  routes: flashcardsWebManifest.routes.map((route) => ({
    path: route.path,
    routeId: route.routeId,
    element: routeElementById[route.routeId],
    requiresAuth: route.requiresAuth,
  })),
};

const ticTacToeWebModule: WebGameModule = {
  id: ticTacToeWebManifest.id,
  routeBase: ticTacToeWebManifest.routeBase,
  routes: ticTacToeWebManifest.routes.map((route) => ({
    path: route.path,
    routeId: route.routeId,
    element: routeElementById[route.routeId],
    requiresAuth: route.requiresAuth,
  })),
};

const snakeClassicWebModule: WebGameModule = {
  id: snakeClassicWebManifest.id,
  routeBase: snakeClassicWebManifest.routeBase,
  routes: snakeClassicWebManifest.routes.map((route) => ({
    path: route.path,
    routeId: route.routeId,
    element: routeElementById[route.routeId],
    requiresAuth: route.requiresAuth,
  })),
};

export const webGameRegistry: WebGameModule[] = [
  flashcardsWebModule,
  snakeClassicWebModule,
  ticTacToeWebModule,
];

export function buildGameRoutes(): RouteObject[] {
  return buildRoutesFromModules(webGameRegistry);
}
