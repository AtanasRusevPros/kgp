import type { FastifyInstance } from 'fastify';
import { MarkKnownSchema, SavePositionSchema } from '@kids-games/shared';
import { getPool } from '../../db/client.js';
import * as deckRepo from '../../repositories/deck.repository.js';
import * as progressRepo from '../../repositories/progress.repository.js';
import { mapDeck, mapCard } from '../../mappers.js';

const FLASHCARD_GAME_ID = 'flashcards';

export async function registerFlashcardsBackendAdapter(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Querystring: { lang?: string } }>(
    '/flashcards/decks',
    async (request, reply) => {
      const decks = await deckRepo.findDecks(
        getPool(),
        FLASHCARD_GAME_ID,
        request.query.lang,
      );
      return reply.send(decks.map(mapDeck));
    },
  );

  app.get<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId',
    async (request, reply) => {
      const deck = await deckRepo.findDeckById(getPool(), request.params.deckId);
      if (!deck) {
        return reply
          .status(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Deck not found' });
      }
      return reply.send(mapDeck(deck));
    },
  );

  app.get<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/cards',
    async (request, reply) => {
      const deck = await deckRepo.findDeckById(getPool(), request.params.deckId);
      if (!deck) {
        return reply
          .status(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Deck not found' });
      }
      const cards = await deckRepo.findCardsByDeck(getPool(), request.params.deckId);
      return reply.send(cards.map(mapCard));
    },
  );

  app.get<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/progress',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const pool = getPool();
      const [progress, knownCardIds] = await Promise.all([
        progressRepo.getDeckProgress(pool, request.user.userId, request.params.deckId),
        progressRepo.getKnownCardIds(pool, request.user.userId, request.params.deckId),
      ]);
      return reply.send({
        lastIndex: progress?.last_index ?? 0,
        knownCount: progress?.known_count ?? 0,
        knownCardIds,
        updatedAt: progress?.updated_at ?? null,
      });
    },
  );

  app.post<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/progress/position',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

      if (idempotencyKey) {
        const cached = await progressRepo.getIdempotencyKey(getPool(), idempotencyKey);
        if (cached) return reply.send(cached.response);
      }

      const body = SavePositionSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: body.error.errors[0]?.message ?? 'Validation error',
        });
      }

      await progressRepo.savePosition(
        getPool(),
        request.user.userId,
        request.params.deckId,
        body.data.lastIndex,
      );

      const response = { ok: true };

      if (idempotencyKey) {
        await progressRepo.saveIdempotencyKey(
          getPool(),
          idempotencyKey,
          request.user.userId,
          response,
        );
      }

      return reply.send(response);
    },
  );

  app.post<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/progress/known',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

      if (idempotencyKey) {
        const cached = await progressRepo.getIdempotencyKey(getPool(), idempotencyKey);
        if (cached) return reply.send(cached.response);
      }

      const body = MarkKnownSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: body.error.errors[0]?.message ?? 'Validation error',
        });
      }

      await progressRepo.setCardKnown(
        getPool(),
        request.user.userId,
        request.params.deckId,
        body.data.cardId,
        body.data.known,
      );

      const response = { ok: true };

      if (idempotencyKey) {
        await progressRepo.saveIdempotencyKey(
          getPool(),
          idempotencyKey,
          request.user.userId,
          response,
        );
      }

      return reply.send(response);
    },
  );
}
