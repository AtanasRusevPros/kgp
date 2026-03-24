import { describe, expect, it, vi } from 'vitest';
import { registerShutdownHandlers } from '../server-lifecycle.js';

describe('registerShutdownHandlers', () => {
  it('closes the app and exits cleanly on SIGTERM', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const info = vi.fn();
    const error = vi.fn();
    const handlers = new Map<NodeJS.Signals, () => void>();
    const exit = vi.fn();

    registerShutdownHandlers(
      {
        close,
        log: { info, error },
      } as never,
      {
        exit: exit as never,
        onSignal: ((signal: NodeJS.Signals, listener: () => void) => {
          handlers.set(signal, listener);
          return process;
        }) as never,
      },
    );

    handlers.get('SIGTERM')?.();
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(0);
    });

    expect(close).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith({ signal: 'SIGTERM' }, 'Received shutdown signal');
    expect(error).not.toHaveBeenCalled();
  });

  it('exits with failure when graceful shutdown throws', async () => {
    const close = vi.fn().mockRejectedValue(new Error('close failed'));
    const info = vi.fn();
    const error = vi.fn();
    const handlers = new Map<NodeJS.Signals, () => void>();
    const exit = vi.fn();

    registerShutdownHandlers(
      {
        close,
        log: { info, error },
      } as never,
      {
        exit: exit as never,
        onSignal: ((signal: NodeJS.Signals, listener: () => void) => {
          handlers.set(signal, listener);
          return process;
        }) as never,
      },
    );

    handlers.get('SIGINT')?.();
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });

    expect(close).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
