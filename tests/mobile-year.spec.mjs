import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fresh, seedItems, smallTargets, overflowX, pngSize } from './helpers.mjs';

test('yil rasmi 1080×1920 va yuklab olinadi', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=year]');
  await expect(page.locator('#page')).toHaveJSProperty('open', true);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#page').getByRole('button', { name: 'Yuklab olish' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^mening-yilim-\d{4}\.png$/);
  expect(pngSize(await fs.readFile(await dl.path()))).toEqual({ w: 1080, h: 1920 });
});

test('doneAt yo‘q — umumiy', async ({ page }) => {
  await fresh(page);
  const s = await page.evaluate(() => yearStats(items, new Date().getFullYear()));
  expect(s.mode).toBe('all'); expect(s.count).toBe(62);
  expect(s.top.map((x) => x.rating)).toEqual([10, 10, 10]);
});

test('shu yil tugatilganlar', async ({ page }) => {
  const y = new Date().getFullYear(), t = Date.UTC(y, 2, 1);
  await seedItems(page, [
    { id: 'a', order: 1, title: 'A', uz: 'A', type: 'Anime', status: 'done', rating: 9, progress: '', note: '', updated: 0, doneAt: t, total: 12, epMin: 24, genres: ['Action'] },
    { id: 'b', order: 2, title: 'B', uz: 'B', type: 'Anime', status: 'done', rating: 7, progress: '', note: '', updated: 0, doneAt: Date.UTC(y - 1, 5, 1), total: 0, epMin: 0, genres: [] }]);
  await page.goto('/');
  const s = await page.evaluate((y) => yearStats(items, y), y);
  expect(s).toMatchObject({ mode: 'year', count: 1, hours: 5, avg: 9, genre: 'Jangari' });
});

test('ulashish tugmasi Web Share bo‘lsa chiqadi', async ({ page }) => {
  await page.addInitScript(() => { navigator.canShare = () => true; navigator.share = async (d) => { window.__shared = d.files[0].name; }; });
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=year]');
  await page.locator('#page').getByRole('button', { name: 'Ulashish' }).click();
  expect(await page.evaluate(() => window.__shared)).toMatch(/\.png$/);
});

test('sahifa orqaga bilan yopiladi va mobil qoidalarga mos', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=year]');
  await expect(page.locator('#page .share-prev img')).toHaveAttribute('alt', 'Ulashiladigan rasm');
  await expect(page.locator('#page').getByRole('button', { name: 'Yuklab olish' })).toBeVisible();
  expect(await smallTargets(page)).toEqual([]); expect(await overflowX(page)).toBeLessThanOrEqual(0);
  await page.goBack(); await expect(page.locator('#page')).toHaveJSProperty('open', false);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});
