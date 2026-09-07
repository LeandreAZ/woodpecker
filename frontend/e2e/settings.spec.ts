import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
test('persists Solver preferences after save and refresh @smoke', async ({ page }) => {
  await login(page, 'settings');
  await page.goto('/settings');
  const coordinates = page.locator('label').filter({ hasText: 'Afficher les coordonnées' }).locator('input[type="checkbox"]');
  const before = await coordinates.isChecked();
  await coordinates.locator('..').click();
  await page.getByRole('button', { name: 'Enregistrer les modifications', exact: true }).last().click();
  await page.reload();
  await expect(coordinates).toBeChecked({ checked: !before });
});
