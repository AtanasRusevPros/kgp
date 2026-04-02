import { mkdir, writeFile } from 'node:fs/promises';
import pg from 'pg';

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      args[key] = 'true';
      continue;
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function trimPlanNode(node) {
  return {
    nodeType: node['Node Type'],
    relationName: node['Relation Name'] ?? null,
    indexName: node['Index Name'] ?? null,
    startupCost: node['Startup Cost'],
    totalCost: node['Total Cost'],
    planRows: node['Plan Rows'],
    planWidth: node['Plan Width'],
    actualRows: node['Actual Rows'],
    actualLoops: node['Actual Loops'],
    filter: node['Filter'] ?? null,
    indexCondition: node['Index Cond'] ?? null,
    plans: Array.isArray(node.Plans) ? node.Plans.map(trimPlanNode) : [],
  };
}

async function explain(client, name, sql, params) {
  const result = await client.query(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
    params,
  );
  const plan = result.rows[0]['QUERY PLAN'][0];

  return {
    name,
    planningTimeMs: plan['Planning Time'] ?? 0,
    executionTimeMs: plan['Execution Time'] ?? 0,
    plan: trimPlanNode(plan.Plan),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const databaseUrl =
    args['database-url'] ??
    process.env['KG_PERF_DATABASE_URL'] ??
    process.env['DATABASE_URL'] ??
    'postgresql://postgres:postgres@localhost:5432/kids_games_dev';
  const outputPath =
    args['output'] ?? process.env['KG_PERF_OUTPUT'] ?? '/tmp/kgp-perf/db-analysis.json';

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const deckResult = await client.query(
      `SELECT d.id, c.id AS card_id
       FROM decks d
       JOIN cards c ON c.deck_id = d.id
       ORDER BY d.created_at ASC, c.sort_order ASC
       LIMIT 1`,
    );

    if (deckResult.rows.length === 0) {
      throw new Error('No flashcards deck/card data available for DB perf analysis.');
    }

    const deckId = deckResult.rows[0].id;
    const cardId = deckResult.rows[0].card_id;

    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`perf-db-${Date.now()}@example.com`, 'perf-hash', 'Perf DB'],
    );
    const userId = userResult.rows[0].id;

    const explains = [];
    explains.push(
      await explain(
        client,
        'games_enabled_list',
        `SELECT id, title, status
         FROM games
         WHERE status = 'enabled'
         ORDER BY title`,
        [],
      ),
    );
    explains.push(
      await explain(
        client,
        'decks_by_game_and_lang',
        `SELECT d.*, COUNT(c.id)::int AS card_count
         FROM decks d
         LEFT JOIN cards c ON c.deck_id = d.id
         WHERE d.game_id = $1 AND d.language_code = $2
         GROUP BY d.id
         ORDER BY d.title`,
        ['flashcards', 'en'],
      ),
    );
    explains.push(
      await explain(
        client,
        'cards_by_deck',
        `SELECT *
         FROM cards
         WHERE deck_id = $1
         ORDER BY sort_order`,
        [deckId],
      ),
    );
    explains.push(
      await explain(
        client,
        'deck_progress_read',
        `SELECT *
         FROM user_deck_progress
         WHERE user_id = $1 AND deck_id = $2`,
        [userId, deckId],
      ),
    );
    explains.push(
      await explain(
        client,
        'known_cards_read',
        `SELECT card_id
         FROM user_known_cards
         WHERE user_id = $1 AND deck_id = $2`,
        [userId, deckId],
      ),
    );
    explains.push(
      await explain(
        client,
        'progress_position_upsert',
        `INSERT INTO user_deck_progress (user_id, deck_id, last_index, known_count, updated_at)
         VALUES ($1, $2, $3, 0, NOW())
         ON CONFLICT (user_id, deck_id)
         DO UPDATE SET last_index = $3, updated_at = NOW()`,
        [userId, deckId, 3],
      ),
    );
    explains.push(
      await explain(
        client,
        'known_card_upsert',
        `INSERT INTO user_known_cards (user_id, card_id, deck_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, card_id) DO NOTHING`,
        [userId, cardId, deckId],
      ),
    );
    explains.push(
      await explain(
        client,
        'known_count_aggregate',
        `SELECT COUNT(*)::int AS count
         FROM user_known_cards
         WHERE user_id = $1 AND deck_id = $2`,
        [userId, deckId],
      ),
    );

    await client.query('ROLLBACK');

    const output = {
      generatedAt: new Date().toISOString(),
      databaseUrlRedacted: databaseUrl.replace(/:[^:@/]+@/, ':***@'),
      explains,
    };

    await mkdir(outputPath.replace(/\/[^/]+$/, ''), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(`Wrote DB analysis to ${outputPath}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
