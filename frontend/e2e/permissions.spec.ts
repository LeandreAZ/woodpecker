import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { createTraining } from './helpers/training';
test('hides a private training from another user', async ({ page, browser }) => {
  await login(page, 'owner');
  const id = await createTraining(page, 'E2E Privé');
  const other = await browser.newPage();
  await login(other, 'other');
  const response = await other.request.get(`/api/trainings/${id}`);
  expect([401, 403, 404]).toContain(response.status());
  await other.goto(`/trainings/${id}`);
  await expect(other.getByRole('heading', { name: /introuvable|accès|erreur/i })).toBeVisible();
});
