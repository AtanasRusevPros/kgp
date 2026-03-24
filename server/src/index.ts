import { createApp } from './app.js';
import { config } from './config.js';
import { registerShutdownHandlers } from './server-lifecycle.js';

const STARTUP_RETRY_DELAY_MS = 2_000;
const STARTUP_MAX_ATTEMPTS = 20;

function isRetriableStartupError(err: unknown): boolean {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
  const message = err instanceof Error ? err.message : String(err);

  return (
    code === 'ECONNREFUSED' ||
    code === '57P03' ||
    code === '42P01' ||
    /ECONNREFUSED|the database system is starting up|connect/i.test(message)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let app;

for (let attempt = 1; attempt <= STARTUP_MAX_ATTEMPTS; attempt += 1) {
  try {
    app = await createApp();
    registerShutdownHandlers(app);
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`API server listening on port ${config.port}`);
    break;
  } catch (err) {
    if (app) {
      await app.close().catch(() => undefined);
    }

    if (!isRetriableStartupError(err) || attempt === STARTUP_MAX_ATTEMPTS) {
      console.error(err);
      process.exit(1);
    }

    console.warn(
      `API startup attempt ${attempt}/${STARTUP_MAX_ATTEMPTS} failed; retrying in ${STARTUP_RETRY_DELAY_MS}ms...`,
    );
    await sleep(STARTUP_RETRY_DELAY_MS);
  }
}
