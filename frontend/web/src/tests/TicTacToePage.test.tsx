import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TicTacToePage } from '../pages/ticTacToe/TicTacToePage.js';

vi.mock('../services/auth.service.js', () => ({
  isLoggedIn: vi.fn(() => true),
  logout: vi.fn(),
}));

describe('TicTacToePage', () => {
  it('shows the initial player and allows alternating moves', async () => {
    render(<MemoryRouter><TicTacToePage /></MemoryRouter>);

    expect(screen.getByText('Current player: X')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cell 1' }));
    expect(screen.getByRole('button', { name: 'Cell 1' })).toHaveTextContent('X');
    expect(screen.getByText('Current player: O')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cell 2' }));
    expect(screen.getByRole('button', { name: 'Cell 2' })).toHaveTextContent('O');
  });

  it('announces a winner and resets the board', async () => {
    render(<MemoryRouter><TicTacToePage /></MemoryRouter>);

    await userEvent.click(screen.getByRole('button', { name: 'Cell 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cell 4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cell 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cell 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cell 3' }));

    expect(screen.getByText('Player X wins!')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset board' }));

    expect(screen.getByText('Current player: X')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cell 1' })).toHaveTextContent('');
  });
});
