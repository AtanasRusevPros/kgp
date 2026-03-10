import type pg from 'pg';

export interface GameRow {
  id: string;
  title: string;
  description: string;
  icon_emoji: string;
  status: 'enabled' | 'disabled';
  route_base: string;
  integration_mode: 'local' | 'external';
  client_targets: string[];
  capabilities: string[];
  api_version: string;
  requires_user_auth: boolean;
  requires_app_identity: boolean;
  required_scopes: string[];
  token_audience: string;
  entry_web: string | null;
  entry_mobile: string | null;
  created_at: Date;
}

export async function findAllGames(pool: pg.Pool): Promise<GameRow[]> {
  const result = await pool.query<GameRow>(
    `SELECT * FROM games WHERE status = 'enabled' ORDER BY title`,
  );
  return result.rows;
}

export async function findEnabledGamesByIds(
  pool: pg.Pool,
  gameIds: string[],
): Promise<GameRow[]> {
  if (gameIds.length === 0) return [];
  const result = await pool.query<GameRow>(
    `SELECT * FROM games
     WHERE status = 'enabled' AND id = ANY($1::text[])
     ORDER BY title`,
    [gameIds],
  );
  return result.rows;
}

export async function findGameById(
  pool: pg.Pool,
  gameId: string,
): Promise<GameRow | null> {
  const result = await pool.query<GameRow>(
    'SELECT * FROM games WHERE id = $1',
    [gameId],
  );
  return result.rows[0] ?? null;
}

export async function findEnabledGameById(
  pool: pg.Pool,
  gameId: string,
): Promise<GameRow | null> {
  const result = await pool.query<GameRow>(
    `SELECT * FROM games WHERE id = $1 AND status = 'enabled'`,
    [gameId],
  );
  return result.rows[0] ?? null;
}
