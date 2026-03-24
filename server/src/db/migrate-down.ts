#!/usr/bin/env node
/**
 * Removes the last migration entry from the tracking table so it can be
 * reapplied by migrate.ts.  NOTE: this does NOT revert schema changes —
 * no DOWN sql is defined for MVP migrations.  Use db:reset to start fresh.
 */
import pg from 'pg';

const DB_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5432/kids_games_dev';

const client = new pg.Client({ connectionString: DB_URL });

try {
  await client.connect();

  const { rows } = await client.query<{ name: string }>(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1',
  );

  if (rows.length === 0) {
    console.log('No migrations to roll back.');
  } else {
    const name = rows[0]!.name;
    await client.query('DELETE FROM migrations WHERE name = $1', [name]);
    console.log(`✓ Unmarked migration: ${name}`);
    console.log('  Run db:migrate to reapply it.');
  }
} finally {
  await client.end();
}
