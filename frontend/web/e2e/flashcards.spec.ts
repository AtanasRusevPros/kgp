/**
 * Minimal end-to-end test: flashcards flow.
 * Raw `pnpm test:e2e` expects a reachable API + web runtime.
 * `./dev.sh test:e2e` auto-prepares DB and starts a temporary API runtime.
 *
 * Run with: pnpm test:e2e
 * Skip in CI by not including this suite (CI runs unit/integration only).
 */
import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e-${Date.now()}@e2e-test.local`;
const TEST_EMAIL_NEW = `e2e-new-${Date.now()}@e2e-test.local`;
const TEST_PASSWORD = 'E2ePass123!';
const TEST_NAME = 'E2E User';

function getApiUrl(): string {
  if (process.env['E2E_API_URL']) {
    return process.env['E2E_API_URL'];
  }

  const stackBaseUrl = process.env['BASE_URL_STACK'];
  if (stackBaseUrl) {
    return new URL('/api', stackBaseUrl).toString().replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

const API_URL = getApiUrl();

test.describe('Flashcards e2e flow', () => {
  test.beforeAll(async ({ request }) => {
    // Register a fresh user via the API directly
    const res = await request.post(`${API_URL}/auth/register`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD, displayName: TEST_NAME },
    });
    if (!res.ok()) {
      throw new Error(`Setup failed: could not register test user (${res.status()})`);
    }
  });

  test('register and login flow', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(TEST_EMAIL_NEW);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByLabel(/your name/i).fill(TEST_NAME);
    await page.getByRole('button', { name: /create account/i }).click();
    // Should redirect to menu after register
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/game library/i)).toBeVisible();
  });

  test('login, open deck, browse cards, mark known, verify progress persists', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    // 2. Navigate to flashcards
    await page.getByText('Flash Cards').click();
    await expect(page).toHaveURL('/flashcards');

    // 3. Pick first deck
    const deckCard = page.getByRole('button', { name: /english basics/i });
    await expect(deckCard).toBeVisible();
    await deckCard.click();
    await expect(page.url()).toMatch(/\/flashcards\/.+/);

    // 4. Verify first card is shown
    await expect(page.getByText(/card 1 of/i)).toBeVisible();

    // 5. Mark first card as known
    await page.getByRole('button', { name: /mark as known/i }).click();
    await expect(page.getByRole('button', { name: /known!/i })).toBeVisible();

    // 6. Navigate to next card
    await page.getByRole('button', { name: /next card/i }).click();
    await expect(page.getByText(/card 2 of/i)).toBeVisible();

    // 7. Reload and verify progress persisted (known count ≥ 1)
    await page.reload();
    const progressCounter = page.getByText(/\d+\/\d+ known/);
    await expect(progressCounter).toBeVisible();
    const progressText = await progressCounter.textContent();
    const [known] = (progressText ?? '0/0').split('/');
    expect(parseInt(known ?? '0')).toBeGreaterThanOrEqual(1);
  });

  test('blocks unsupported game routes', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/spelling-bee');

    const friendlyFallback = page.getByText('This game is not available.');
    const router404 = page.getByRole('heading', { name: '404 Not Found' });

    await expect(friendlyFallback.or(router404)).toBeVisible();

    if (await friendlyFallback.isVisible()) {
      await expect(
        page.getByText('The route you opened is not currently approved or supported in this build.'),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /return to library/i })).toBeVisible();
      return;
    }

    await expect(page.getByRole('heading', { name: 'Unexpected Application Error!' })).toBeVisible();
  });

  test('login and play the first tic-tac-toe move through the live route', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/tic-tac-toe');
    await expect(page).toHaveURL('/tic-tac-toe');
    await expect(page.getByRole('heading', { name: 'Tic-Tac-Toe' })).toBeVisible();
    await expect(page.getByText('Current player: X')).toBeVisible();

    const firstCell = page.getByRole('button', { name: 'Cell 1' });
    await firstCell.click();

    await expect(firstCell).toContainText('X');
    await expect(page.getByText('Current player: O')).toBeVisible();
  });
});
