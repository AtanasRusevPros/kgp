import { readFile, writeFile } from 'node:fs/promises';

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

async function readJson(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

async function main() {
  const args = parseArgs(process.argv);
  const frontendPath = args.frontend;
  const apiPath = args.api;
  const dbPath = args.db;
  const stackPath = args.stack;
  const outputPath = args.output;

  if (!frontendPath || !apiPath || !dbPath || !outputPath) {
    throw new Error(
      'Usage: node scripts/perf-report.mjs --frontend <file> --api <file> --db <file> [--stack <file>] --output <file>',
    );
  }

  const [frontend, api, db] = await Promise.all([
    readJson(frontendPath),
    readJson(apiPath),
    readJson(dbPath),
  ]);
  const stack = stackPath ? await readJson(stackPath) : null;

  const lines = [];
  lines.push('# Performance Baseline Report');
  lines.push('');
  lines.push(`Created: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Scope');
  lines.push('');
  lines.push(`- Frontend baseline source: \`${frontendPath}\``);
  lines.push(`- API load source: \`${apiPath}\``);
  lines.push(`- DB analysis source: \`${dbPath}\``);
  lines.push(`- Stack comparison source: \`${stackPath ?? 'not captured in this run'}\``);
  lines.push('');
  lines.push('## Frontend baseline');
  lines.push('');
  lines.push(`- Menu route load: ${formatMs(frontend.routes.menu.elapsedMs)}`);
  lines.push(`- Flashcards deck picker load: ${formatMs(frontend.routes.flashcards.elapsedMs)}`);
  lines.push(`- Tic-Tac-Toe route load: ${formatMs(frontend.routes.ticTacToe.elapsedMs)}`);
  lines.push(`- Tic-Tac-Toe hover sweep: ${formatMs(frontend.routes.ticTacToe.hoverSweepMs)}`);
  lines.push(
    `- Tic-Tac-Toe approximate animation FPS sample: ${frontend.routes.ticTacToe.animationSample.approxFps.toFixed(2)}`,
  );
  lines.push(`- Snake route load: ${formatMs(frontend.routes.snakeClassic.elapsedMs)}`);
  lines.push(
    `- Snake approximate animation FPS sample: ${frontend.routes.snakeClassic.animationSample.approxFps.toFixed(2)}`,
  );
  lines.push(`- Browser trace artifact: \`${frontend.artifacts.tracePath}\``);
  lines.push('');
  lines.push('## API load summary');
  lines.push('');
  for (const scenario of api.scenarios) {
    lines.push(
      `- ${scenario.name}: ${scenario.requestsCompleted} requests, p95 ${formatMs(
        scenario.latency.p95Ms,
      )}, throughput ${scenario.throughputRps.toFixed(2)} req/s, error rate ${(
        scenario.errorRate * 100
      ).toFixed(2)}%`,
    );
  }
  lines.push('');
  lines.push('## Database analysis summary');
  lines.push('');
  for (const item of db.explains) {
    lines.push(
      `- ${item.name}: planning ${formatMs(item.planningTimeMs)}, execution ${formatMs(
        item.executionTimeMs,
      )}, root node ${item.plan.nodeType}`,
    );
  }
  lines.push('');

  if (stack) {
    lines.push('## Stack API comparison');
    lines.push('');
    for (const scenario of stack.scenarios) {
      lines.push(
        `- ${scenario.name}: ${scenario.requestsCompleted} requests, p95 ${formatMs(
          scenario.latency.p95Ms,
        )}, throughput ${scenario.throughputRps.toFixed(2)} req/s, error rate ${(
          scenario.errorRate * 100
        ).toFixed(2)}%`,
      );
    }
    lines.push('');
  } else {
    lines.push('## Stack API comparison');
    lines.push('');
    lines.push('- Skipped in this run because the Podman+Caddy stack was not already healthy.');
    lines.push('');
  }

  lines.push('## Early observations');
  lines.push('');
  lines.push('- This baseline captures the current custom fetch client architecture without TanStack Query.');
  lines.push('- This baseline captures the current HTTP request/response model without WebSockets.');
  lines.push('- Before/after comparisons must reuse the same routes, user/load tiers, and environment notes.');
  lines.push('');

  await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote performance report to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
