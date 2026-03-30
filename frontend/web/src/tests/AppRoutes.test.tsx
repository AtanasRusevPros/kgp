import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from '../App.js';

const { mockIsLoggedIn } = vi.hoisted(() => ({
  mockIsLoggedIn: vi.fn(() => true),
}));

vi.mock('../services/auth.service.js', () => ({
  isLoggedIn: mockIsLoggedIn,
  logout: vi.fn(),
}));

describe('app routes', () => {
  beforeEach(() => {
    mockIsLoggedIn.mockReturnValue(true);
  });

  it('renders snake-classic through the protected app route tree', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/snake-classic'],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Snake Classic' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'A 50x50 Nokia-inspired snake board with adaptive camera behavior, hold-to-follow mouse guidance, keyboard and swipe controls, and reduced-motion-aware presentation.',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByRole('application', { name: 'Snake Classic board' })).toBeInTheDocument();
  });

  it('renders tic-tac-toe through the protected app route tree', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/tic-tac-toe'],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Tic-Tac-Toe' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'A KGP-compliant, Figma-inspired game board with animated marks, responsive glass panels, and reduced-motion-aware celebration effects.',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Player X's Turn")).toBeInTheDocument();
  });

  it('shows the blocked-game fallback for unsupported routes', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/spelling-bee'],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('This game is not available.')).toBeInTheDocument();
    expect(
      screen.getByText('The route you opened is not currently approved or supported in this build.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Requested game:')).toBeInTheDocument();
    expect(screen.getByText('spelling-bee')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to library' })).toHaveAttribute('href', '/');
  });
});
