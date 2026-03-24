import type { FastifyInstance } from 'fastify';

type ExitFn = (code: number) => never;
type RegisterHandlerFn = (signal: NodeJS.Signals, listener: () => void) => NodeJS.Process;

interface ShutdownRegistrationOpts {
  exit?: ExitFn;
  onSignal?: RegisterHandlerFn;
}

export function registerShutdownHandlers(
  app: FastifyInstance,
  opts: ShutdownRegistrationOpts = {},
): void {
  const exit = opts.exit ?? process.exit;
  const onSignal = opts.onSignal ?? process.on.bind(process);

  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
      app.log.info({ signal }, 'Received shutdown signal');
      await app.close();
      exit(0);
    } catch (err) {
      app.log.error({ err, signal }, 'Graceful shutdown failed');
      exit(1);
    }
  };

  onSignal('SIGINT', () => {
    void shutdown('SIGINT');
  });
  onSignal('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
