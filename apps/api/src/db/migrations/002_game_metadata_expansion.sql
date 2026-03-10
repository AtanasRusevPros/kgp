-- Migration: 002_game_metadata_expansion
-- Adds modular game metadata fields required for allowlisted registry-driven routing.

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS route_base TEXT NOT NULL DEFAULT '/games',
  ADD COLUMN IF NOT EXISTS integration_mode TEXT NOT NULL DEFAULT 'local' CHECK (integration_mode IN ('local', 'external')),
  ADD COLUMN IF NOT EXISTS client_targets TEXT[] NOT NULL DEFAULT '{web}',
  ADD COLUMN IF NOT EXISTS capabilities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS api_version TEXT NOT NULL DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS requires_user_auth BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS requires_app_identity BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS required_scopes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS token_audience TEXT NOT NULL DEFAULT 'kids-games-api',
  ADD COLUMN IF NOT EXISTS entry_web TEXT,
  ADD COLUMN IF NOT EXISTS entry_mobile TEXT;

-- Backfill known game defaults where route_base should be explicit.
UPDATE games
SET route_base = CASE id
  WHEN 'flashcards' THEN '/flashcards'
  ELSE '/games/' || id
END
WHERE route_base = '/games';
