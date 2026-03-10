import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { getPool } from '../db/client.js';
import * as clientRepo from '../repositories/integration-client.repository.js';

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function constantTimeEqualHex(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function hasScope(scopes: string[], requiredScope: string): boolean {
  return scopes.includes(requiredScope);
}

export async function verifyAppClientOrNull(
  request: FastifyRequest,
  gameId: string,
  requiredScope?: string,
): Promise<{ clientId: string; scopes: string[] } | null> {
  const clientId = (request.headers['x-game-client-id'] as string | undefined)?.trim();
  const clientSecret = (request.headers['x-game-client-secret'] as string | undefined)?.trim();

  if (!clientId || !clientSecret) return null;

  const client = await clientRepo.findEnabledClientById(getPool(), clientId);
  if (!client) return null;
  if (client.game_id !== gameId) return null;
  if (requiredScope && !hasScope(client.scopes, requiredScope)) return null;

  const incomingHash = sha256Hex(clientSecret);
  if (!constantTimeEqualHex(incomingHash, client.secret_hash)) return null;

  return { clientId: client.client_id, scopes: client.scopes };
}
