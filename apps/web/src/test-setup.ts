import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.onLine (configurable so individual tests can override it)
Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });

// Silence React Router future flag warnings
vi.stubGlobal('__reactRouterFutureFlags', {});

const originalWarn = console.warn;
vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  const first = args[0];
  if (
    typeof first === 'string'
    && first.includes('React Router Future Flag Warning')
  ) {
    return;
  }
  originalWarn(...(args as []));
});
