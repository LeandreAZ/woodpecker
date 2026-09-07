import { expect, type Page } from '@playwright/test';
import { api } from './auth';
import { puzzles } from '../fixtures/puzzles';
export async function createTraining(page: Page, name: string) {
  await page.goto('/trainings/new');
  await page.getByPlaceholder('Ex : Maîtrise des finales de tours').fill(name);
  await page.getByPlaceholder("Décrivez l'objectif de cet entraînement...").fill('Campagne E2E déterministe');
  await page.getByRole('button', { name: "Créer l'entraînement", exact: true }).click();
  await expect(page).toHaveURL(/\/trainings\/\d+$/);
  return Number(new URL(page.url()).pathname.split('/')[2]);
}
export async function attachPuzzles(page: Page, id: number) {
  for (const [position, fixture] of puzzles.entries()) {
    const { wrong: _wrong, ...data } = fixture;
    void _wrong;
    // API setup only: attempts, cycles and outcomes are always produced by the UI.
    const puzzle = await api(page, '/puzzles', { ...data, externalId: `${data.externalId}-${id}` });
    await api(page, '/training_puzzles', { training: `/api/trainings/${id}`, puzzle: puzzle['@id'], position });
  }
}
export async function startCycle(page: Page, id: number, number: number) {
  await page.goto(`/trainings/${id}`);
  await page.getByRole('button', { name: number === 1 ? 'Démarrer le cycle' : 'Lancer le cycle suivant', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/trainings/${id}/solver$`));
  await expect(page.getByRole('heading', { name: 'Puzzle 1 / 5', exact: true })).toBeVisible();
  // Pin the initial selection; the default otherwise follows the next pending puzzle.
  await page.locator('.wp-solver-list-v2__row').first().click();
}
