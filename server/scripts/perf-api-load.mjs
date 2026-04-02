import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

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

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1),
  );
  return sortedValues[index];
}

function summarizeDurations(durations) {
  const sorted = [...durations].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return {
    count: sorted.length,
    avgMs: sorted.length === 0 ? 0 : total / sorted.length,
    minMs: sorted[0] ?? 0,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    maxMs: sorted.at(-1) ?? 0,
  };
}

async function jsonRequest(baseUrl, path, options = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, options);
  const durationMs = performance.now() - startedAt;
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    durationMs,
    body,
  };
}

async function runScenario(name, users, iterationsPerUser, worker) {
  const durations = [];
  let failures = 0;
  const startedAt = performance.now();

  await Promise.all(
    Array.from({ length: users }, async (_value, userIndex) => {
      for (let iteration = 0; iteration < iterationsPerUser; iteration += 1) {
        try {
          const result = await worker(userIndex, iteration);
          durations.push(result.durationMs);
          if (!result.ok) {
            failures += 1;
          }
        } catch {
          failures += 1;
        }
      }
    }),
  );

  const wallTimeMs = performance.now() - startedAt;
  const requestsCompleted = durations.length + failures;

  return {
    name,
    users,
    iterationsPerUser,
    requestsCompleted,
    failures,
    errorRate: requestsCompleted === 0 ? 0 : failures / requestsCompleted,
    wallTimeMs,
    throughputRps: wallTimeMs === 0 ? 0 : requestsCompleted / (wallTimeMs / 1000),
    latency: summarizeDurations(durations),
  };
}

async function ensurePerfUser(baseUrl) {
  const email = `perf-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = 'perf-password-1234';
  const displayName = 'Perf User';

  const register = await jsonRequest(baseUrl, '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });

  if (!register.ok) {
    throw new Error(`Could not create perf user: ${JSON.stringify(register.body)}`);
  }

  return {
    email,
    password,
    accessToken: register.body.accessToken,
  };
}

async function resolveDeckScenarioData(baseUrl, accessToken) {
  const decks = await jsonRequest(baseUrl, '/flashcards/decks?lang=en');
  if (!decks.ok || !Array.isArray(decks.body) || decks.body.length === 0) {
    throw new Error('Could not resolve flashcards deck for perf scenario.');
  }

  const deckId = decks.body[0].id;
  const cards = await jsonRequest(baseUrl, `/flashcards/decks/${deckId}/cards`);
  if (!cards.ok || !Array.isArray(cards.body) || cards.body.length === 0) {
    throw new Error('Could not resolve flashcards cards for perf scenario.');
  }

  return {
    deckId,
    cardId: cards.body[0].id,
    authHeaders: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const baseUrl = args['base-url'] ?? process.env['KG_PERF_API_BASE_URL'] ?? 'http://127.0.0.1:3400';
  const users = parseInt(args['users'] ?? process.env['KG_PERF_USERS'] ?? '25', 10);
  const iterationsPerUser = parseInt(
    args['iterations'] ?? process.env['KG_PERF_ITERATIONS'] ?? '4',
    10,
  );
  const outputPath =
    args['output'] ?? process.env['KG_PERF_OUTPUT'] ?? '/tmp/kgp-perf/api-load.json';

  const perfUser = await ensurePerfUser(baseUrl);
  const scenarioData = await resolveDeckScenarioData(baseUrl, perfUser.accessToken);

  const scenarios = [];

  scenarios.push(
    await runScenario('games_list', users, iterationsPerUser, async () =>
      jsonRequest(baseUrl, '/games'),
    ),
  );

  scenarios.push(
    await runScenario('flashcards_decks', users, iterationsPerUser, async () =>
      jsonRequest(baseUrl, '/flashcards/decks?lang=en'),
    ),
  );

  scenarios.push(
    await runScenario('flashcards_cards', users, iterationsPerUser, async () =>
      jsonRequest(baseUrl, `/flashcards/decks/${scenarioData.deckId}/cards`),
    ),
  );

  scenarios.push(
    await runScenario('auth_login_then_me', users, iterationsPerUser, async () => {
      const startedAt = performance.now();
      const login = await jsonRequest(baseUrl, '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: perfUser.email,
          password: perfUser.password,
        }),
      });

      if (!login.ok) {
        return {
          ok: false,
          durationMs: performance.now() - startedAt,
        };
      }

      const me = await jsonRequest(baseUrl, '/auth/me', {
        headers: {
          Authorization: `Bearer ${login.body.accessToken}`,
        },
      });

      return {
        ok: me.ok,
        durationMs: performance.now() - startedAt,
      };
    }),
  );

  scenarios.push(
    await runScenario('flashcards_progress_read', users, iterationsPerUser, async () =>
      jsonRequest(baseUrl, `/flashcards/decks/${scenarioData.deckId}/progress`, {
        headers: {
          Authorization: `Bearer ${perfUser.accessToken}`,
        },
      }),
    ),
  );

  scenarios.push(
    await runScenario('flashcards_progress_position_write', users, iterationsPerUser, async (_userIndex, iteration) =>
      jsonRequest(baseUrl, `/flashcards/decks/${scenarioData.deckId}/progress/position`, {
        method: 'POST',
        headers: {
          ...scenarioData.authHeaders,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({ lastIndex: iteration % 5 }),
      }),
    ),
  );

  scenarios.push(
    await runScenario('flashcards_progress_known_write', users, iterationsPerUser, async (_userIndex, iteration) =>
      jsonRequest(baseUrl, `/flashcards/decks/${scenarioData.deckId}/progress/known`, {
        method: 'POST',
        headers: {
          ...scenarioData.authHeaders,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          cardId: scenarioData.cardId,
          known: iteration % 2 === 0,
        }),
      }),
    ),
  );

  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    users,
    iterationsPerUser,
    scenarios,
  };

  await mkdir(outputPath.replace(/\/[^/]+$/, ''), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote API load metrics to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
