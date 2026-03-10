import type pg from 'pg';

export interface IntegrationClientRow {
  client_id: string;
  secret_hash: string;
  game_id: string;
  scopes: string[];
  status: 'enabled' | 'disabled';
  created_at: Date;
  updated_at: Date;
}

export async function findEnabledClientById(
  pool: pg.Pool,
  clientId: string,
): Promise<IntegrationClientRow | null> {
  const result = await pool.query<IntegrationClientRow>(
    `SELECT * FROM integration_clients
     WHERE client_id = $1 AND status = 'enabled'`,
    [clientId],
  );
  return result.rows[0] ?? null;
}
