/**
 * Minimal end-to-end test: flashcards flow.
 * Raw `pnpm test:e2e` expects a reachable API + web runtime.
 * `./dev.sh test:e2e` auto-prepares DB and starts a temporary API runtime.
 *
 * Run with: pnpm test:e2e
 * Skip in CI by not including this suite (CI runs unit/integration only).
 */
import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const TEST_PASSWORD = 'E2ePass123!';
const TEST_NAME = 'E2E User';

async function registerAndLoginViaUi(
  page: Page,
  email: string,
): Promise<void> {
  await page.goto('/register');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByLabel(/your name/i).fill(TEST_NAME);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL('/');
}

async function readSnakeBoardState(board: Locator) {
  return await board.evaluate((node) => ({
    score: Number(node.getAttribute('data-score') ?? '0'),
    status: node.getAttribute('data-status') ?? 'running',
    direction: node.getAttribute('data-direction') ?? 'right',
    headX: Number(node.getAttribute('data-head-x') ?? '-1'),
    headY: Number(node.getAttribute('data-head-y') ?? '-1'),
    appleX: Number(node.getAttribute('data-apple-x') ?? '-1'),
    appleY: Number(node.getAttribute('data-apple-y') ?? '-1'),
  }));
}

function toArrowKey(direction: string): 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' {
  switch (direction) {
    case 'up':
      return 'ArrowUp';
    case 'down':
      return 'ArrowDown';
    case 'left':
      return 'ArrowLeft';
    default:
      return 'ArrowRight';
  }
}

function isOppositeDirection(
  current: string,
  next: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
): boolean {
  return (
    (current === 'up' && next === 'ArrowDown')
    || (current === 'down' && next === 'ArrowUp')
    || (current === 'left' && next === 'ArrowRight')
    || (current === 'right' && next === 'ArrowLeft')
  );
}

function chooseSnakeKey(state: {
  direction: string;
  headX: number;
  headY: number;
  appleX: number;
  appleY: number;
}): 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' {
  const horizontal =
    state.appleX === state.headX
      ? null
      : state.appleX > state.headX
        ? 'ArrowRight'
        : 'ArrowLeft';
  const vertical =
    state.appleY === state.headY
      ? null
      : state.appleY > state.headY
        ? 'ArrowDown'
        : 'ArrowUp';

  if (horizontal && !isOppositeDirection(state.direction, horizontal)) {
    return horizontal;
  }

  if (vertical && !isOppositeDirection(state.direction, vertical)) {
    return vertical;
  }

  return state.direction === 'left' || state.direction === 'right'
    ? 'ArrowUp'
    : 'ArrowLeft';
}

test.describe('Flashcards e2e flow', () => {
  test('register and login flow', async ({ page }) => {
    const testEmail = `e2e-register-${Date.now()}@e2e-test.local`;

    await page.goto('/register');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByLabel(/your name/i).fill(TEST_NAME);
    await page.getByRole('button', { name: /create account/i }).click();
    // Should redirect to menu after register
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/game library/i)).toBeVisible();
  });

  test('login, open deck, browse cards, mark known, verify progress persists', async ({ page }) => {
    const testEmail = `e2e-flashcards-${Date.now()}@e2e-test.local`;
    await registerAndLoginViaUi(page, testEmail);

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
    const testEmail = `e2e-blocked-${Date.now()}@e2e-test.local`;
    await registerAndLoginViaUi(page, testEmail);

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
    const testEmail = `e2e-ttt-${Date.now()}@e2e-test.local`;
    await registerAndLoginViaUi(page, testEmail);

    await page.goto('/tic-tac-toe');
    await expect(page).toHaveURL('/tic-tac-toe');
    await expect(page.getByRole('heading', { name: 'Tic-Tac-Toe' })).toBeVisible();
    await expect(page.getByText("Player X's Turn")).toBeVisible();

    const firstCell = page.getByRole('button', { name: 'Cell 1' });
    await firstCell.click();

    await expect(firstCell).toContainText('X');
    await expect(page.getByText("Player O's Turn")).toBeVisible();
  });

  test('login, play snake-classic through the live route, and restart after game over', async ({ page }) => {
    const testEmail = `e2e-snake-${Date.now()}@e2e-test.local`;
    await registerAndLoginViaUi(page, testEmail);

    await page.goto('/snake-classic');
    await expect(page).toHaveURL('/snake-classic');
    await expect(page.getByRole('heading', { name: 'Snake Classic' })).toBeVisible();

    const board = page.getByRole('application', { name: 'Snake Classic board' });
    await expect(board).toBeVisible();
    let snakeState = await readSnakeBoardState(board);
    for (let step = 0; step < 80 && snakeState.score < 1 && snakeState.status === 'running'; step += 1) {
      await page.keyboard.press(chooseSnakeKey(snakeState));
      await page.waitForTimeout(180);
      snakeState = await readSnakeBoardState(board);
    }

    expect(snakeState.score).toBe(1);

    await page.keyboard.press(toArrowKey(snakeState.direction));

    await expect
      .poll(async () => (await readSnakeBoardState(board)).status, {
        timeout: 8_000,
        intervals: [100, 120, 140, 160],
      })
      .toBe('game-over');

    await page.getByRole('button', { name: 'New run' }).click();

    await expect
      .poll(async () => (await readSnakeBoardState(board)).status, {
        timeout: 2_000,
      })
      .toBe('running');
    await expect
      .poll(async () => (await readSnakeBoardState(board)).score, {
        timeout: 2_000,
      })
      .toBe(0);
  });
});
