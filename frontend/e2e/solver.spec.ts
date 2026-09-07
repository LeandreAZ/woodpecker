import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { attachPuzzles, createTraining, startCycle } from './helpers/training';
import { puzzles } from './fixtures/puzzles';
import { playMove } from './helpers/chessboard';
test('plays three cycles and keeps first errors failed after eventual solutions @critical', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 1400 });
  await login(page);
  const id = await createTraining(page, 'E2E Trois cycles');
  await attachPuzzles(page, id);
  await page.goto(`/trainings/${id}/solver`);
  await expect(page.getByRole('heading', { name: 'Aucun cycle démarré' })).toBeVisible();
  const cycles = [
    [{ errors: 0, solved: true }, { errors: 2, solved: true }, { errors: 1, solved: false }, { errors: 0, solved: true }, { errors: 1, solved: false }],
    [{ errors: 0, solved: true }, { errors: 0, solved: true }, { errors: 0, solved: true }, { errors: 1, solved: true }, { errors: 3, solved: true }],
    puzzles.map(() => ({ errors: 0, solved: true })),
  ];
  for (const [cycleIndex, outcomes] of cycles.entries()) {
    await startCycle(page, id, cycleIndex + 1);
    for (const [index, outcome] of outcomes.entries()) {
      await expect(page.getByRole('heading', { name: `Puzzle ${index + 1} / 5`, exact: true })).toBeVisible();
      for (let attempt = 1; attempt <= outcome.errors; attempt++) await playMove(page, puzzles[index].wrong, attempt);
      if (outcome.solved) await playMove(page, puzzles[index].solution[0], outcome.errors + 1);
      await expect(page.locator('.wp-solver-summary-v2').getByText(outcome.errors ? 'Raté' : 'Réussi', { exact: true })).toBeVisible();
      if (index === 1 && cycleIndex === 0) {
        await page.reload();
        await page.locator('.wp-solver-list-v2__row').nth(index).click();
        await expect(page.locator('.wp-solver-summary-v2').getByText('Raté', { exact: true })).toBeVisible();
        await expect(page.locator('.wp-solver-summary-v2__attempt-text')).toContainText('3 tentatives');
      }
      if (index < 4) await page.getByRole('button', { name: 'Suivant', exact: true }).click();
    }
    await page.goto(`/trainings/${id}`);
    await expect(page.getByRole('button', { name: 'Lancer le cycle suivant', exact: true })).toBeVisible();
  }
  await page.goto('/history');
  await expect(page.getByRole('combobox', { name: /^Activité/ })).toHaveValue('attempt');
  await page.getByRole('combobox', { name: /^Entraînement/ }).selectOption(`/api/trainings/${id}`);
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(21);
  await expect(rows.filter({ hasText: 'Cycle 1' })).toHaveCount(7);
  await expect(rows.filter({ hasText: 'Cycle 2' })).toHaveCount(9);
  await expect(rows.filter({ hasText: 'Cycle 3' })).toHaveCount(5);
  await expect(rows.first()).toContainText('Cycle 3');
  await expect(rows.last()).toContainText('Cycle 1');
  await expect(rows.filter({ hasText: 'Essai 4' })).toHaveCount(1);
  await expect(rows.filter({ hasText: 'Essai 3' })).toHaveCount(2);

  await expect(page.getByRole('heading', { name: /Historique/ }).first()).toBeVisible();
  await page.goto('/stats');
  await expect(page.getByRole('heading', { name: /Statistiques/ }).first()).toBeVisible();
  await page.getByRole('combobox').first().selectOption(`/api/trainings/${id}`);
  const columns = page.locator('.wp-training-stats-cycle-results__column');
  for (const [index, values] of [[2, 1, 2], [3, 2, 0], [5, 0, 0]].entries()) {
    for (const [category, count] of ['direct', 'rescued', 'unresolved'].map((category, i) => [category, values[i]] as const)) {
      const segment = columns.nth(index).locator(`.is-${category}`);
      if (count) await expect(segment).toHaveText(String(count));
      else await expect(segment).toHaveCount(0);
    }
  }
  const distribution = page.locator('article').filter({ has: page.getByRole('heading', { name: "Distribution du nombre d'essais", exact: true }) });
  for (const [label, count] of [['1 essai', 10], ['2 essais', 1], ['3 essais', 1], ['4 essais ou plus', 1]] as const) {
    const row = distribution.locator('.wp-training-stats-result-row').filter({ has: page.getByText(label, { exact: true }) });
    await expect(row.locator('.wp-training-stats-result-row__meta > span')).toHaveText(String(count));
  }
});
