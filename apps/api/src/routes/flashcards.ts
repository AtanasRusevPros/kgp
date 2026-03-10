import type { FastifyInstance } from 'fastify';
import { registerFlashcardsBackendAdapter } from '@kids-games/flashcards-backend-adapter';
import { getPool } from '../db/client.js';
import * as deckRepo from '../repositories/deck.repository.js';
import * as progressRepo from '../repositories/progress.repository.js';
import { mapDeck, mapCard } from '../mappers.js';

const FLASHCARD_GAME_ID = 'flashcards';

export async function flashcardRoutes(app: FastifyInstance): Promise<void> {
  await registerFlashcardsBackendAdapter(app, {
    async getDecks(lang) {
      const decks = await deckRepo.findDecks(getPool(), FLASHCARD_GAME_ID, lang);
      return decks.map(mapDeck);
    },
    async getDeckById(deckId) {
      const deck = await deckRepo.findDeckById(getPool(), deckId);
      return deck ? mapDeck(deck) : null;
    },
    async getCardsByDeck(deckId) {
      const cards = await deckRepo.findCardsByDeck(getPool(), deckId);
      return cards.map(mapCard);
    },
    async getProgress(userId, deckId) {
      const pool = getPool();
      const [progress, knownCardIds] = await Promise.all([
        progressRepo.getDeckProgress(pool, userId, deckId),
        progressRepo.getKnownCardIds(pool, userId, deckId),
      ]);
      return {
        lastIndex: progress?.last_index ?? 0,
        knownCount: progress?.known_count ?? 0,
        knownCardIds,
        updatedAt: progress?.updated_at ?? null,
      };
    },
    async savePosition(userId, deckId, lastIndex) {
      await progressRepo.savePosition(getPool(), userId, deckId, lastIndex);
    },
    async setCardKnown(userId, deckId, cardId, known) {
      await progressRepo.setCardKnown(getPool(), userId, deckId, cardId, known);
    },
    async getIdempotencyKey(idempotencyKey) {
      return progressRepo.getIdempotencyKey(getPool(), idempotencyKey);
    },
    async saveIdempotencyKey(idempotencyKey, userId, response) {
      await progressRepo.saveIdempotencyKey(getPool(), idempotencyKey, userId, response);
    },
  });
}
