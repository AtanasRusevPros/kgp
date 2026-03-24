import type { RouteObject } from 'react-router-dom';
import type { WebGameModule } from './types.js';
import { buildRoutesFromModules } from './types.js';
import { flashcardsWebManifest } from '../../../../games/flashcards/web/src/module.js';
import { DeckPickerPage } from '../pages/flashcards/DeckPickerPage.js';
import { FlashcardGamePage } from '../pages/flashcards/FlashcardGamePage.js';

const routeElementById = {
  'flashcards.deck-picker': <DeckPickerPage />,
  'flashcards.game': <FlashcardGamePage />,
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

export const webGameRegistry: WebGameModule[] = [
  flashcardsWebModule,
];

export function buildGameRoutes(): RouteObject[] {
  return buildRoutesFromModules(webGameRegistry);
}
