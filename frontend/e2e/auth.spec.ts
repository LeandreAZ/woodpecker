import { test, expect } from '@playwright/test';
import { login, password } from './helpers/auth';
test('registers through the form and reaches an empty dashboard', async ({ page }, testInfo) => {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Inscription' }).click();
  await page
    .getByLabel('Adresse e-mail')
    .fill(`e2e-register-${Date.now()}-${testInfo.retry}-${crypto.randomUUID()}@woodpecker.test`);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
test('rejects invalid credentials and protects the dashboard', async ({ page }) => {
  await page.goto('/auth');
  await page.getByLabel('Adresse e-mail').fill('e2e-auth@woodpecker.test');
  await page.locator('input[name="password"]').fill('incorrect-password');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Email ou mot de passe incorrect.');
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  expect((await page.request.get('/api')).status()).toBe(401);
});
test('keeps the session after refresh then logs out @smoke', async ({ page }) => {
  await login(page, 'auth');
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: /déconnexion|déconnecter/i }).click();
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
});
