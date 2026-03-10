import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { MarkKnownSchema, SavePositionSchema } from '@kids-games/shared';

interface AuthenticatedUser {
  userId: string;
}

type AuthenticatedRequest<TRequest extends FastifyRequest = FastifyRequest> = TRequest & {
  user: AuthenticatedUser;
};

type AuthenticatedApp = FastifyInstance & {
  authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
};

export interface FlashcardsProgressState {
  lastIndex: number;
  knownCount: number;
  knownCardIds: string[];
  updatedAt: string | Date | null;
}

export interface FlashcardsDeckDto {
  id: string;
  gameId: string;
  languageCode: string;
  title: string;
  description: string;
  cardCount: number;
  version: number;
  createdAt: string | Date;
}

export interface FlashcardsCardDto {
  id: string;
  deckId: string;
  term: string;
  imagePath: string | null;
  audioPath: string | null;
  tags: string[];
}

export interface FlashcardsBackendAdapterDeps {
  getDecks(lang?: string): Promise<FlashcardsDeckDto[]>;
  getDeckById(deckId: string): Promise<FlashcardsDeckDto | null>;
  getCardsByDeck(deckId: string): Promise<FlashcardsCardDto[]>;
  getProgress(userId: string, deckId: string): Promise<FlashcardsProgressState>;
  savePosition(userId: string, deckId: string, lastIndex: number): Promise<void>;
  setCardKnown(
    userId: string,
    deckId: string,
    cardId: string,
    known: boolean,
  ): Promise<void>;
  getIdempotencyKey(idempotencyKey: string): Promise<{ response: unknown } | null>;
  saveIdempotencyKey(
    idempotencyKey: string,
    userId: string,
    response: { ok: true },
  ): Promise<void>;
}

export async function registerFlashcardsBackendAdapter(
  app: FastifyInstance,
  deps: FlashcardsBackendAdapterDeps,
): Promise<void> {
  const authApp = app as AuthenticatedApp;

  app.get<{ Querystring: { lang?: string } }>(
    '/flashcards/decks',
    async (request, reply) => {
      return reply.send(await deps.getDecks(request.query.lang));
    },
  );

  app.get<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId',
    async (request, reply) => {
      const deck = await deps.getDeckById(request.params.deckId);
      if (!deck) {
        return reply
          .status(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Deck not found' });
      }
      return reply.send(deck);
    },
  );

  app.get<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/cards',
    async (request, reply) => {
      const deck = await deps.getDeckById(request.params.deckId);
      if (!deck) {
        return reply
          .status(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Deck not found' });
      }
      return reply.send(await deps.getCardsByDeck(request.params.deckId));
    },
  );

  app.get<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/progress',
    { onRequest: [authApp.authenticate] },
    async (request, reply) => {
      const authRequest = request as AuthenticatedRequest<typeof request>;
      return reply.send(
        await deps.getProgress(authRequest.user.userId, request.params.deckId),
      );
    },
  );

  app.post<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/progress/position',
    { onRequest: [authApp.authenticate] },
    async (request, reply) => {
      const authRequest = request as AuthenticatedRequest<typeof request>;
      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

      if (idempotencyKey) {
        const cached = await deps.getIdempotencyKey(idempotencyKey);
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

      await deps.savePosition(
        authRequest.user.userId,
        request.params.deckId,
        body.data.lastIndex,
      );

      const response = { ok: true } as const;

      if (idempotencyKey) {
        await deps.saveIdempotencyKey(
          idempotencyKey,
          authRequest.user.userId,
          response,
        );
      }

      return reply.send(response);
    },
  );

  app.post<{ Params: { deckId: string } }>(
    '/flashcards/decks/:deckId/progress/known',
    { onRequest: [authApp.authenticate] },
    async (request, reply) => {
      const authRequest = request as AuthenticatedRequest<typeof request>;
      const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

      if (idempotencyKey) {
        const cached = await deps.getIdempotencyKey(idempotencyKey);
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

      await deps.setCardKnown(
        authRequest.user.userId,
        request.params.deckId,
        body.data.cardId,
        body.data.known,
      );

      const response = { ok: true } as const;

      if (idempotencyKey) {
        await deps.saveIdempotencyKey(
          idempotencyKey,
          authRequest.user.userId,
          response,
        );
      }

      return reply.send(response);
    },
  );
}
