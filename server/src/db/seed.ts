#!/usr/bin/env node
/**
 * Seeds the database with initial game, deck, and card data.
 * Run via: pnpm db:seed
 */
import { createPool } from './client.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { PoolClient } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/kids_games_dev';
const pool = createPool(dbUrl);

function makeSvgDataUri(emoji: string, bgColor: string, term: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${bgColor}" rx="16"/>
    <text x="100" y="110" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="100" y="175" font-size="18" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">${term}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const BG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#a855f7', '#e11d48', '#65a30d', '#0891b2',
  '#7c3aed', '#d97706', '#059669', '#dc2626', '#2563eb',
];

interface SeedCard {
  term: string;
  tags: string[];
  emoji: string;
}

interface SeedData {
  game: {
    id: string;
    title: string;
    description: string;
    iconEmoji: string;
    status: string;
    routeBase?: string;
    integrationMode?: 'local' | 'external';
    clientTargets?: string[];
    capabilities?: string[];
    apiVersion?: string;
    authPolicy?: {
      requiresUserAuth?: boolean;
      requiresAppIdentity?: boolean;
      requiredScopes?: string[];
      tokenAudience?: string;
    };
    entryWeb?: string | null;
    entryMobile?: string | null;
  };
  deck: { languageCode: string; title: string; description: string; version: number };
  cards: SeedCard[];
}

interface SeedGameRecord {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  status: string;
  routeBase: string;
  integrationMode: 'local' | 'external';
  clientTargets: string[];
  capabilities: string[];
  apiVersion: string;
  requiresUserAuth: boolean;
  requiresAppIdentity: boolean;
  requiredScopes: string[];
  tokenAudience: string;
  entryWeb: string | null;
  entryMobile: string | null;
}

async function upsertGame(client: PoolClient, game: SeedGameRecord) {
  await client.query(
    `INSERT INTO games (
       id, title, description, icon_emoji, status,
       route_base, integration_mode, client_targets, capabilities, api_version,
       requires_user_auth, requires_app_identity, required_scopes, token_audience,
       entry_web, entry_mobile
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     ON CONFLICT (id) DO UPDATE SET
       title=$2,
       description=$3,
       icon_emoji=$4,
       status=$5,
       route_base=$6,
       integration_mode=$7,
       client_targets=$8,
       capabilities=$9,
       api_version=$10,
       requires_user_auth=$11,
       requires_app_identity=$12,
       required_scopes=$13,
       token_audience=$14,
       entry_web=$15,
       entry_mobile=$16`,
    [
      game.id,
      game.title,
      game.description,
      game.iconEmoji,
      game.status,
      game.routeBase,
      game.integrationMode,
      game.clientTargets,
      game.capabilities,
      game.apiVersion,
      game.requiresUserAuth,
      game.requiresAppIdentity,
      game.requiredScopes,
      game.tokenAudience,
      game.entryWeb,
      game.entryMobile,
    ],
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dataPath = join(__dirname, 'seed-data', 'english-deck.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf8')) as SeedData;

    // Upsert game
    const routeBase = data.game.routeBase ?? `/games/${data.game.id}`;
    const integrationMode = data.game.integrationMode ?? 'local';
    const clientTargets = data.game.clientTargets ?? ['web'];
    const capabilities = data.game.capabilities ?? ['progress'];
    const apiVersion = data.game.apiVersion ?? 'v1';
    const requiresUserAuth = data.game.authPolicy?.requiresUserAuth ?? true;
    const requiresAppIdentity = data.game.authPolicy?.requiresAppIdentity ?? false;
    const requiredScopes = data.game.authPolicy?.requiredScopes ?? [];
    const tokenAudience = data.game.authPolicy?.tokenAudience ?? 'kids-games-api';
    const entryWeb = data.game.entryWeb ?? routeBase;
    const entryMobile = data.game.entryMobile ?? null;

    await upsertGame(client, {
      id: data.game.id,
      title: data.game.title,
      description: data.game.description,
      iconEmoji: data.game.iconEmoji,
      status: data.game.status,
      routeBase,
      integrationMode,
      clientTargets,
      capabilities,
      apiVersion,
      requiresUserAuth,
      requiresAppIdentity,
      requiredScopes,
      tokenAudience,
      entryWeb,
      entryMobile,
    });
    console.log(`✓ Upserted game: ${data.game.id}`);

    await upsertGame(client, {
      id: 'tic-tac-toe',
      title: 'Tic-Tac-Toe',
      description: 'A simple local two-player strategy game played directly in the browser.',
      iconEmoji: '⭕',
      status: 'enabled',
      routeBase: '/tic-tac-toe',
      integrationMode: 'local',
      clientTargets: ['web'],
      capabilities: ['local-play'],
      apiVersion: 'v1',
      requiresUserAuth: true,
      requiresAppIdentity: false,
      requiredScopes: [],
      tokenAudience: 'kids-games-api',
      entryWeb: '/tic-tac-toe',
      entryMobile: null,
    });
    console.log('✓ Upserted game: tic-tac-toe');

    await upsertGame(client, {
      id: 'snake-classic',
      title: 'Snake Classic',
      description: 'A modernized Nokia-inspired snake run with adaptive camera controls and persistent high score tracking.',
      iconEmoji: '🐍',
      status: 'enabled',
      routeBase: '/snake-classic',
      integrationMode: 'local',
      clientTargets: ['web'],
      capabilities: ['local-play', 'high-score'],
      apiVersion: 'v1',
      requiresUserAuth: true,
      requiresAppIdentity: false,
      requiredScopes: [],
      tokenAudience: 'kids-games-api',
      entryWeb: '/snake-classic',
      entryMobile: null,
    });
    console.log('✓ Upserted game: snake-classic');

    const defaultClientId = 'flashcards-web-dev';
    const defaultClientSecret =
      process.env['FLASHCARDS_CLIENT_SECRET'] ?? 'flashcards-dev-secret';
    const defaultClientSecretHash = createHash('sha256')
      .update(defaultClientSecret)
      .digest('hex');

    await client.query(
      `INSERT INTO integration_clients (client_id, secret_hash, game_id, scopes, status)
       VALUES ($1, $2, $3, $4, 'enabled')
       ON CONFLICT (client_id) DO UPDATE SET
         secret_hash = $2,
         game_id = $3,
         scopes = $4,
         status = 'enabled',
         updated_at = NOW()`,
      [defaultClientId, defaultClientSecretHash, data.game.id, ['flashcards:play', 'points:add']],
    );
    console.log(`✓ Upserted integration client: ${defaultClientId}`);

    // Check if deck already exists
    const existing = await client.query(
      'SELECT id FROM decks WHERE game_id=$1 AND language_code=$2 AND title=$3',
      [data.game.id, data.deck.languageCode, data.deck.title],
    );

    let deckId: string;
    if (existing.rows.length > 0) {
      deckId = existing.rows[0].id as string;
      console.log(`✓ Deck already exists: ${deckId}`);
    } else {
      const deckResult = await client.query(
        `INSERT INTO decks (game_id, language_code, title, description, version)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [data.game.id, data.deck.languageCode, data.deck.title, data.deck.description, data.deck.version],
      );
      deckId = deckResult.rows[0].id as string;
      console.log(`✓ Created deck: ${deckId}`);

      // Insert cards
      for (let i = 0; i < data.cards.length; i++) {
        const card = data.cards[i]!;
        const imagePath = makeSvgDataUri(card.emoji, BG_COLORS[i % BG_COLORS.length]!, card.term);
        await client.query(
          `INSERT INTO cards (deck_id, term, image_path, audio_path, tags, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [deckId, card.term, imagePath, null, card.tags, i],
        );
      }
      console.log(`✓ Inserted ${data.cards.length} cards`);
    }

    await client.query('COMMIT');
    console.log('✓ Seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
