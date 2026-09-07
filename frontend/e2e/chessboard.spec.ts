import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { createTraining, attachPuzzles, startCycle } from './helpers/training';
import { playMove } from './helpers/chessboard';
import { puzzles } from './fixtures/puzzles';
test('plays one real board move and persists its attempt', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await login(page);
  const id = await createTraining(page, 'E2E Coup réel');
  await attachPuzzles(page, id);
  await startCycle(page, id, 1);
  await playMove(page, puzzles[0].solution[0], 1);
  await expect(page.locator('.wp-solver-summary-v2').getByText('Réussi', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('.wp-solver-list-v2__row').first().click();
  await expect(page.locator('.wp-solver-summary-v2__attempt-text')).toContainText('1 tentative');
});
