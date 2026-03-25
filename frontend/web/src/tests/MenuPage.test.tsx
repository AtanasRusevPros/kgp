import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MenuPage } from '../pages/MenuPage.js';

vi.mock('../services/api.js', () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('../services/auth.service.js', () => ({
  isLoggedIn: vi.fn(() => true),
  logout: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { apiFetch } from '../services/api.js';

const MOCK_GAMES = [
  {
    id: 'flashcards',
    title: 'Flash Cards',
    description: 'Learn words',
    iconEmoji: '🃏',
    status: 'enabled',
    routeBase: '/flashcards',
    integrationMode: 'local',
    clientTargets: ['web', 'mobile'],
    capabilities: ['progress', 'offline-queue'],
    apiVersion: 'v1',
    authPolicy: {
      requiresUserAuth: true,
      requiresAppIdentity: true,
      requiredScopes: ['points:add'],
      tokenAudience: 'game:flashcards',
    },
    entryWeb: '/flashcards',
    entryMobile: null,
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Play a quick browser-local match.',
    iconEmoji: '⭕',
    status: 'enabled',
    routeBase: '/tic-tac-toe',
    integrationMode: 'local',
    clientTargets: ['web'],
    capabilities: ['local-play'],
    apiVersion: 'v1',
    authPolicy: {
      requiresUserAuth: true,
      requiresAppIdentity: false,
      requiredScopes: [],
      tokenAudience: 'kids-games-api',
    },
    entryWeb: '/tic-tac-toe',
    entryMobile: null,
  },
];

describe('MenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><MenuPage /></MemoryRouter>);
    expect(document.querySelector('.animate-bounce')).toBeTruthy();
  });

  it('renders game list after load', async () => {
    vi.mocked(apiFetch).mockResolvedValue(MOCK_GAMES);
    render(<MemoryRouter><MenuPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Flash Cards')).toBeTruthy());
    expect(screen.getByText('Learn words')).toBeTruthy();
    expect(screen.getByText('🃏')).toBeTruthy();
    expect(screen.getByText('Tic-Tac-Toe')).toBeTruthy();
    expect(screen.getByText('Play a quick browser-local match.')).toBeTruthy();
  });

  it('navigates to flashcards on game click', async () => {
    vi.mocked(apiFetch).mockResolvedValue(MOCK_GAMES);
    render(<MemoryRouter><MenuPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Flash Cards'));
    await userEvent.click(screen.getByText('Flash Cards'));
    expect(mockNavigate).toHaveBeenCalledWith('/flashcards');
  });

  it('navigates to tic-tac-toe on game click', async () => {
    vi.mocked(apiFetch).mockResolvedValue(MOCK_GAMES);
    render(<MemoryRouter><MenuPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Tic-Tac-Toe'));
    await userEvent.click(screen.getByText('Tic-Tac-Toe'));
    expect(mockNavigate).toHaveBeenCalledWith('/tic-tac-toe');
  });

  it('shows error message when API fails', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('Network error'));
    render(<MemoryRouter><MenuPage /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText(/could not load games/i)).toBeTruthy(),
    );
  });

  it('shows empty state when no games returned', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    render(<MemoryRouter><MenuPage /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText(/no games available/i)).toBeTruthy(),
    );
  });
});
