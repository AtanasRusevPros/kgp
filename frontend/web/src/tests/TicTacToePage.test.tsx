import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { TicTacToePage } from '../pages/ticTacToe/TicTacToePage.js';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../services/auth.service.js', () => ({
  isLoggedIn: vi.fn(() => true),
  logout: vi.fn(),
}));

const mockConfetti = vi.mocked(confetti);

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

describe('TicTacToePage', () => {
  beforeEach(() => {
    mockConfetti.mockReset();
    mockMatchMedia(false);
    window.localStorage.clear();
  });

  it('shows the initial player and allows alternating moves', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TicTacToePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Player X's Turn")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Effects On' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Player X score')).toHaveTextContent('0');
    expect(screen.getByLabelText('Draws score')).toHaveTextContent('0');
    expect(screen.getByLabelText('Player O score')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Cell 1' }));
    expect(screen.getByRole('button', { name: 'Cell 1' })).toHaveTextContent('X');
    expect(await screen.findByText("Player O's Turn")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cell 2' }));
    expect(screen.getByRole('button', { name: 'Cell 2' })).toHaveTextContent('O');
  });

  it('announces a winner, increments the score, and resets the round', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TicTacToePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Cell 1' }));
    await user.click(screen.getByRole('button', { name: 'Cell 4' }));
    await user.click(screen.getByRole('button', { name: 'Cell 2' }));
    await user.click(screen.getByRole('button', { name: 'Cell 5' }));
    await user.click(screen.getByRole('button', { name: 'Cell 3' }));

    expect(await screen.findByText('Player X Wins!')).toBeInTheDocument();
    expect(screen.getByLabelText('Player X score')).toHaveTextContent('1');
    expect(mockConfetti).toHaveBeenCalledTimes(3);

    await user.click(screen.getByRole('button', { name: 'Reset board' }));

    expect(await screen.findByText("Player X's Turn")).toBeInTheDocument();
    expect(screen.getByLabelText('Player X score')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'Cell 1' })).toHaveTextContent('');
    await user.click(screen.getByRole('button', { name: 'Cell 6' }));
    expect(screen.getByRole('button', { name: 'Cell 6' })).toHaveTextContent('X');
  });

  it('can toggle all effects off and keep the game playable', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TicTacToePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Effects On' }));
    expect(screen.getByRole('button', { name: 'Effects Off' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Cell 1' }));
    await user.click(screen.getByRole('button', { name: 'Cell 4' }));
    await user.click(screen.getByRole('button', { name: 'Cell 2' }));
    await user.click(screen.getByRole('button', { name: 'Cell 5' }));
    await user.click(screen.getByRole('button', { name: 'Cell 3' }));

    expect(await screen.findByText('Player X Wins!')).toBeInTheDocument();
    expect(mockConfetti).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Player X score')).toHaveTextContent('1');
  });

  it('overrides reduced motion when effects are enabled', async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TicTacToePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Cell 1' }));
    await user.click(screen.getByRole('button', { name: 'Cell 4' }));
    await user.click(screen.getByRole('button', { name: 'Cell 2' }));
    await user.click(screen.getByRole('button', { name: 'Cell 5' }));
    await user.click(screen.getByRole('button', { name: 'Cell 3' }));

    expect(await screen.findByText('Player X Wins!')).toBeInTheDocument();
    expect(mockConfetti).toHaveBeenCalledTimes(3);
  });

  it('tracks draws and increments the draw counter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TicTacToePage />
      </MemoryRouter>,
    );

    const moves = [1, 2, 3, 5, 4, 6, 8, 7, 9];
    for (const move of moves) {
      await user.click(screen.getByRole('button', { name: `Cell ${move}` }));
    }

    expect(await screen.findByText("It's a Draw!")).toBeInTheDocument();
    expect(screen.getByLabelText('Draws score')).toHaveTextContent('1');
  });
});
