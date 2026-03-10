export interface FlashcardsRouteManifest {
  path: string;
  routeId: 'flashcards.deck-picker' | 'flashcards.game';
  requiresAuth: boolean;
}

export interface FlashcardsWebManifest {
  id: 'flashcards';
  routeBase: '/flashcards';
  routes: FlashcardsRouteManifest[];
}

export const flashcardsWebManifest: FlashcardsWebManifest = {
  id: 'flashcards',
  routeBase: '/flashcards',
  routes: [
    {
      path: '/flashcards',
      routeId: 'flashcards.deck-picker',
      requiresAuth: true,
    },
    {
      path: '/flashcards/:deckId',
      routeId: 'flashcards.game',
      requiresAuth: true,
    },
  ],
};
