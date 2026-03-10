import type { FastifyInstance } from 'fastify';
import { registerFlashcardsBackendAdapter } from '../games/flashcards/backend-adapter.js';

export async function flashcardRoutes(app: FastifyInstance): Promise<void> {
  await registerFlashcardsBackendAdapter(app);
}
