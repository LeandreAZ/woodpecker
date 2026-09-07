import { expect, type Page } from '@playwright/test';
export async function playMove(page: Page, uci: string, attempt: number) {
  const board = page.locator('.wp-puzzle-solver-v2__board');
  const source = board.locator(`[data-square="${uci.slice(0, 2)}"]`);
  const target = board.locator(`[data-square="${uci.slice(2, 4)}"]`);
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error(`Cases absentes pour ${uci}`);
  // The rendered squares already account for board orientation and scrolling.
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await expect(page.locator('[aria-live]').filter({ hasText: `over droppable area ${uci.slice(2, 4)}` })).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('.wp-solver-summary-v2__attempt-text')).toContainText(`${attempt} tentative`);
}
