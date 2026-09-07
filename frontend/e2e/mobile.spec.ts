import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
test('keeps auth, navigation and settings usable on mobile @mobile @smoke', async ({ page }) => {
  await login(page, 'mobile');
  await expect(page.getByRole('button', { name: 'Mes entraînements' })).toBeVisible();
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByText('Préférences du Solver', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
});
