import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { chromium } from '@playwright/test';

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

async function jsonRequest(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return {
    ok: response.ok,
    body,
  };
}

async function createPerfUser(apiUrl) {
  const email = `perf-browser-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = 'perf-password-1234';

  const register = await jsonRequest(apiUrl, '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName: 'Perf Browser',
    }),
  });

  if (!register.ok) {
    throw new Error(`Could not create browser perf user: ${JSON.stringify(register.body)}`);
  }

  return register.body;
}

async function sampleAnimationFrames(page, durationMs) {
  return page.evaluate(
    async (sampleMs) =>
      new Promise((resolve) => {
        let frames = 0;
        let startedAt = 0;

        const tick = (timestamp) => {
          if (startedAt === 0) {
            startedAt = timestamp;
          }

          frames += 1;

          if (timestamp - startedAt >= sampleMs) {
            const elapsed = timestamp - startedAt;
            resolve({
              frames,
              durationMs: elapsed,
              approxFps: elapsed === 0 ? 0 : (frames * 1000) / elapsed,
            });
            return;
          }

          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    durationMs,
  );
}

async function timedRoute(page, url, readySelector) {
  const startedAt = performance.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(readySelector, { state: 'visible', timeout: 30_000 });
  const elapsedMs = performance.now() - startedAt;

  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    if (!entry) return null;

    return {
      domContentLoadedMs: entry.domContentLoadedEventEnd,
      loadEventMs: entry.loadEventEnd,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    };
  });

  return {
    url,
    elapsedMs,
    navigation,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const appUrl = args['app-url'] ?? process.env['KG_PERF_APP_URL'] ?? 'http://127.0.0.1:4173';
  const apiUrl = args['api-url'] ?? process.env['KG_PERF_API_BASE_URL'] ?? 'http://127.0.0.1:3400';
  const outputPath =
    args['output'] ?? process.env['KG_PERF_OUTPUT'] ?? '/tmp/kgp-perf/frontend-baseline.json';
  const tracePath =
    args['trace-path'] ?? process.env['KG_PERF_TRACE_PATH'] ?? '/tmp/kgp-perf/frontend-trace.zip';

  const tokens = await createPerfUser(apiUrl);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(
    ({ accessToken, refreshToken }) => {
      window.localStorage.setItem('kg_access_token', accessToken);
      window.localStorage.setItem('kg_refresh_token', refreshToken);
    },
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  );

  const page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true });

  try {
    const menu = await timedRoute(page, `${appUrl}/`, 'h1');
    const flashcards = await timedRoute(page, `${appUrl}/flashcards`, 'text=English Basics');
    await page.click('text=English Basics');
    await page.waitForSelector('text=Card', { state: 'visible', timeout: 30_000 });

    const ticTacToe = await timedRoute(page, `${appUrl}/tic-tac-toe`, '[aria-label="Cell 1"]');
    const ticHoverStartedAt = performance.now();
    for (let index = 1; index <= 9; index += 1) {
      await page.hover(`[aria-label="Cell ${index}"]`);
    }
    const ticHoverElapsedMs = performance.now() - ticHoverStartedAt;
    const ticFpsSample = await sampleAnimationFrames(page, 1500);

    const snake = await timedRoute(page, `${appUrl}/snake-classic`, 'canvas');
    await page.click('canvas');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    const snakeFpsSample = await sampleAnimationFrames(page, 1500);

    await mkdir(tracePath.replace(/\/[^/]+$/, ''), { recursive: true });
    await context.tracing.stop({ path: tracePath });

    const output = {
      generatedAt: new Date().toISOString(),
      appUrl,
      apiUrl,
      routes: {
        menu,
        flashcards,
        ticTacToe: {
          ...ticTacToe,
          hoverSweepMs: ticHoverElapsedMs,
          animationSample: ticFpsSample,
        },
        snakeClassic: {
          ...snake,
          animationSample: snakeFpsSample,
        },
      },
      artifacts: {
        tracePath,
      },
      notes: [
        'TanStack Query is not in use in the current frontend baseline.',
        'WebSocket transport is not used in the current frontend baseline.',
      ],
    };

    await mkdir(outputPath.replace(/\/[^/]+$/, ''), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(`Wrote frontend baseline to ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
