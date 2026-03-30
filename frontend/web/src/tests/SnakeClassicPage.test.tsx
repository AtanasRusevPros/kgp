import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SnakeClassicPage } from '../pages/snakeClassic/SnakeClassicPage.js';

vi.mock('../services/auth.service.js', () => ({
  isLoggedIn: vi.fn(() => true),
  logout: vi.fn(),
}));

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function mockBoardRect(board: HTMLElement) {
  Object.defineProperty(board, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 500,
      bottom: 500,
      width: 500,
      height: 500,
      toJSON: () => ({}),
    }),
  });
}

describe('SnakeClassicPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMatchMedia(false);
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a run immediately and restarts cleanly', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SnakeClassicPage />
      </MemoryRouter>,
    );

    const board = screen.getByRole('application', { name: 'Snake Classic board' });
    expect(board).toHaveAttribute('data-status', 'running');
    expect(board).toHaveAttribute('data-head-x', '25');
    expect(board).toHaveAttribute('data-head-y', '25');

    await user.click(screen.getByRole('button', { name: 'New run' }));

    expect(board).toHaveAttribute('data-status', 'running');
    expect(board).toHaveAttribute('data-score', '0');
    expect(board).toHaveAttribute('data-head-x', '25');
    expect(board).toHaveAttribute('data-head-y', '25');
  });

  it('restores persisted settings and high score on load', async () => {
    window.localStorage.setItem(
      'kgp.snakeClassic.settings.v1',
      JSON.stringify({
        difficulty: 'fast',
        reducedMotionOverride: 'off',
        lastControlHint: 'touch',
      }),
    );
    window.localStorage.setItem('kgp.snakeClassic.highScore', '9');

    render(
      <MemoryRouter>
        <SnakeClassicPage />
      </MemoryRouter>,
    );

    const board = await screen.findByRole('application', { name: 'Snake Classic board' });
    expect(screen.getByRole('button', { name: 'fast' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('tick 110ms')).toBeInTheDocument();
    expect(board).toHaveAttribute('data-control-hint', 'touch');
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('follows system reduced-motion by default and can override it', async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SnakeClassicPage />
      </MemoryRouter>,
    );

    const board = await screen.findByRole('application', { name: 'Snake Classic board' });
    expect(board).toHaveAttribute('data-motion-mode', 'reduced');

    await user.click(screen.getByRole('button', { name: 'off' }));
    expect(board).toHaveAttribute('data-motion-mode', 'full');
  });

  it('switches to mouse-follow mode while the pointer is held down', async () => {
    render(
      <MemoryRouter>
        <SnakeClassicPage />
      </MemoryRouter>,
    );

    const board = await screen.findByRole('application', { name: 'Snake Classic board' });
    mockBoardRect(board);

    fireEvent.pointerDown(board, {
      clientX: 440,
      clientY: 250,
      buttons: 1,
      pointerId: 1,
    });
    fireEvent.pointerMove(board, {
      clientX: 460,
      clientY: 250,
      buttons: 1,
      pointerId: 1,
    });

    expect(board).toHaveAttribute('data-control-hint', 'mouse');
  });

  it('switches to touch controls after a swipe gesture', async () => {
    render(
      <MemoryRouter>
        <SnakeClassicPage />
      </MemoryRouter>,
    );

    const board = await screen.findByRole('application', { name: 'Snake Classic board' });

    fireEvent.touchStart(board, {
      touches: [{ clientX: 140, clientY: 140 }],
    });
    fireEvent.touchEnd(board, {
      changedTouches: [{ clientX: 140, clientY: 260 }],
    });

    expect(board).toHaveAttribute('data-control-hint', 'touch');
  });
});
