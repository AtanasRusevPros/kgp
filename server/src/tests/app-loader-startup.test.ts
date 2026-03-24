import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAllowlistedEnabledGamesMock, registerAllowlistedBackendAdaptersMock } = vi.hoisted(
  () => ({
    getAllowlistedEnabledGamesMock: vi.fn(),
    registerAllowlistedBackendAdaptersMock: vi.fn(),
  }),
);

vi.mock('../db/client.js', () => ({
  initPool: vi.fn(),
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn(),
  })),
  closePool: vi.fn(),
}));

vi.mock('ioredis', () => ({ default: vi.fn() }));

vi.mock('../modules/game-registry.js', () => ({
  getAllowlistedEnabledGames: getAllowlistedEnabledGamesMock,
}));

vi.mock('../modules/game-adapter-loader.js', () => ({
  registerAllowlistedBackendAdapters: registerAllowlistedBackendAdaptersMock,
}));

import { createApp } from '../app.js';

describe('createApp backend adapter startup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllowlistedEnabledGamesMock.mockResolvedValue([
      { id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' },
    ]);
    registerAllowlistedBackendAdaptersMock.mockResolvedValue(undefined);
  });

  it('loads allowlisted enabled games through backend adapter registration during startup', async () => {
    const app = await createApp({ logger: false });

    expect(getAllowlistedEnabledGamesMock).toHaveBeenCalledTimes(1);
    expect(registerAllowlistedBackendAdaptersMock).toHaveBeenCalledTimes(1);
    expect(registerAllowlistedBackendAdaptersMock).toHaveBeenCalledWith(
      expect.objectContaining({ inject: expect.any(Function) }),
      [{ id: 'flashcards', title: 'Flashcards', route_base: '/flashcards' }],
    );

    await app.close();
  });

  it('propagates backend adapter startup failures', async () => {
    registerAllowlistedBackendAdaptersMock.mockRejectedValue(
      new Error('backend adapter startup failed'),
    );

    await expect(createApp({ logger: false })).rejects.toThrow('backend adapter startup failed');
  });
});
