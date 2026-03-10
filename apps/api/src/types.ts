/**
 * Fastify / JWT type augmentations for the API.
 */

export interface JwtPayload {
  userId: string;
  email: string;
  typ?: 'user_access' | 'game_session';
  aud?: string;
  scope?: string[];
  gameId?: string;
  clientId?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
