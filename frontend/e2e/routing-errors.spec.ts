import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
test('shows the not found state for an unknown route', async ({ page }) => {
  await login(page, 'routing');
  await page.goto('/route-e2e-inconnue');
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
});
