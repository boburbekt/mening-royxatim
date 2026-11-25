import { test, expect } from '@playwright/test';
import { fresh, smallTargets, seedItems } from './helpers.mjs';

test('bumpProgress jadvali', async ({ page }) => {
  await fresh(page);
  const cases = [['2-fasl, 14-qism', '2-fasl, 15-qism'], ['14/24', '15/24'], ['12', '13'], ['', '1-qism'], ['boshlanmadi', 'boshlanmadi, 1-qism'], ['3-fasl', '4-fasl']];
  for (const [a, b] of cases) expect(await page.evaluate((a) => bumpProgress(a), a)).toBe(b);
});

test('+1 qatordan', async ({ page }) => {
  await fresh(page);
  const row = page.locator('#list .row', { hasText: 'Elita sinfi' });   // watching
  await row.locator('[data-plus]').click();
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
  await expect(row).toContainText('1-qism');
  await page.locator('#toast').getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(row).not.toContainText('1-qism');
});

test('oxirgi qismda Ko‘rildi taklifi', async ({ page }) => {
  await seedItems(page, [{ id: 'w1', order: 1, title: 'X', uz: 'Sinov', type: 'Anime', status: 'watching', rating: 0, progress: '11-qism', note: '', updated: 0, total: 12 }]);
  await page.goto('/');
  await page.locator('#list .row [data-plus]').click();
  await page.locator('#ask').getByRole('button', { name: 'Ha, Ko‘rildi' }).click();
  await expect(page.locator('#list .row [data-status]')).toHaveText('Ko‘rilgan');
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1'])[0].doneAt)).toBeGreaterThan(0);
});

test('+1 faqat Ko‘rilmoqda qatorlarida va ≥44px', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('#list .row [data-plus]')).toHaveCount(6);
  expect(await smallTargets(page)).toEqual([]);
});

test('dialogdagi +1', async ({ page }) => {
  await fresh(page);
  await page.locator('#list .row .uz', { hasText: 'Qora beda' }).click();
  const more = page.locator('#more');
  if (!(await more.evaluate((d) => d.open))) await page.click('#more summary');
  await page.fill('#fProg', '5-qism'); await page.click('#progPlus');
  await expect(page.locator('#fProg')).toHaveValue('6-qism');
});
