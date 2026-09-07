import { test, expect } from '@playwright/test';
import { api, login } from './helpers/auth';
import { createTraining } from './helpers/training';
test('analyses the user CSV and reports valid, invalid and duplicate rows', async ({ page }) => {
  await login(page, 'csv');
  const id = await createTraining(page, 'E2E CSV');
  await page.goto(`/trainings/${id}/import`);
  await page.getByRole('tab', { name: 'Importer un fichier CSV' }).click();
  await page.locator('input[type="file"]').setInputFiles('/fixtures/import-test-valide-erreur-doublon.csv');
  await page.getByRole('button', { name: 'Analyser le fichier', exact: true }).click();
  await expect(page.getByText('2. Validation des puzzles invalides')).toBeVisible();
  await expect(
    page
      .locator('.wp-import-stat')
      .filter({ has: page.getByText('Puzzles valides', { exact: true }) })
      .locator(':scope > strong'),
  ).toHaveText('1');
  await expect(
    page
      .locator('.wp-import-stat')
      .filter({ has: page.getByText('Doublons détectés', { exact: true }) })
      .locator(':scope > strong'),
  ).toHaveText('1');
  await expect(
    page
      .locator('.wp-import-stat')
      .filter({ has: page.getByText('Puzzles invalides', { exact: true }) })
      .locator(':scope > strong'),
  ).toHaveText('1');
  await page.getByRole('button', { name: /Continuer vers l’importation/ }).click();
  const confirmations = page.locator('input[type="checkbox"]');
  await confirmations.all().then(async (items) => {
    for (const item of items) await item.check();
  });
  await expect(
    page
      .locator('.wp-import-stat')
      .filter({ has: page.getByText('Importables', { exact: true }) })
      .locator(':scope > strong'),
  ).toHaveText('1');
  const importButton = page.getByRole('button', { name: /Importer \d+ puzzle/ });
  await expect(importButton).toBeEnabled();
  await importButton.click();
  await expect(page.getByText('Import terminé', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/a été ajouté à l’entraînement|ont été ajoutés à l’entraînement/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Revenir à l’entraînement', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/trainings/${id}$`));
  const imported = await api(page, `/training_puzzles?training=/api/trainings/${id}`, undefined, 'GET');
  const importedRows = imported.member ?? imported['hydra:member'];
  expect(
    importedRows.filter((row: { training: string }) => row.training === `/api/trainings/${id}`),
  ).toHaveLength(1);
});
test('shows Lichess generation criteria and updates the minimum rating slider', async ({ page }) => {
  await login(page, 'csv');
  const id = await createTraining(page, 'E2E Lichess UI');
  await page.goto(`/trainings/${id}/import`);
  await expect(page.getByRole('tab', { name: 'Générer avec Lichess' })).toBeVisible();
  await expect(page.getByText(/Nombre de puzzles|Difficulté/i).first()).toBeVisible();
  await page.getByRole('slider', { name: 'Difficulté minimale' }).fill('500');
  await expect(page.getByRole('slider', { name: 'Difficulté minimale' })).toHaveValue('500');
});
