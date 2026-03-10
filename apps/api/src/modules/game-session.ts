import type { FastifyInstance } from 'fastify';

export interface GameSessionClaims {
  userId: string;
  email: string;
  typ: 'game_session';
  aud: string;
  scope: string[];
  gameId: string;
  clientId: string;
}

export function signGameSessionToken(
  app: FastifyInstance,
  payload: Omit<GameSessionClaims, 'typ' | 'aud'>,
): string {
  return app.jwt.sign(
    {
      ...payload,
      typ: 'game_session',
      aud: `game:${payload.gameId}`,
    },
    { expiresIn: '5m' },
  );
}

export function verifyGameSessionClaimsOrNull(
  app: FastifyInstance,
  token: string,
): GameSessionClaims | null {
  try {
    const decoded = app.jwt.verify<GameSessionClaims>(token);
    if (decoded.typ !== 'game_session') return null;
    if (decoded.aud !== `game:${decoded.gameId}`) return null;
    if (!Array.isArray(decoded.scope)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function hasRequiredScope(claims: GameSessionClaims, scope: string): boolean {
  return claims.scope.includes(scope);
}
