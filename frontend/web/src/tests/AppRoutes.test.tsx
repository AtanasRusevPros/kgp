import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from '../App.js';

vi.mock('../services/auth.service.js', () => ({
  isLoggedIn: vi.fn(() => true),
  logout: vi.fn(),
}));

describe('app routes', () => {
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
