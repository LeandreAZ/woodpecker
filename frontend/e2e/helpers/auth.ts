import { expect, type Page } from '@playwright/test';
export const password = 'E2e-password-2026!';
export async function login(page: Page, user = 'owner') {
  await page.goto('/auth');
  await page.getByLabel('Adresse e-mail').fill(`e2e-${user}@woodpecker.test`);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
export async function api(page: Page, path: string, data?: object, method = 'POST') {
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('woodpecker.auth')!).token);
  const response = await page.request.fetch(`/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': method === 'PATCH' ? 'application/merge-patch+json' : 'application/ld+json', Accept: 'application/ld+json' },
    data,
  });
  expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBeTruthy();
  return response.status() === 204 ? null : response.json();
}
