-- Migration: 003_integration_clients
-- Stores allowlisted game client identities for app-level authentication.

CREATE TABLE IF NOT EXISTS integration_clients (
  client_id    TEXT PRIMARY KEY,
  secret_hash  TEXT NOT NULL,
  game_id      TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  scopes       TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS integration_clients_game_id_idx ON integration_clients(game_id);
CREATE INDEX IF NOT EXISTS integration_clients_status_idx ON integration_clients(status);
