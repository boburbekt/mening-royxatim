import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fresh } from './helpers.mjs';

test('eski va yangi zaxira fayl', async ({ page }) => {
  await fresh(page);
  const old = [{ id: 'o1', order: 1, title: 'Naruto', uz: 'Naruto', type: 'Anime', status: 'done', rating: 8, progress: '', note: '', updated: 0 }];
  await page.setInputFiles('#fileIn', { name: 'eski.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(old)) });
  await page.locator('#ask').getByRole('button', { name: 'Ha, yuklash' }).click();
  const it = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1'])[0]);
  expect(it).toMatchObject({ doneAt: 0, total: 0, epMin: 0, genres: [], tier: '' });
  const neu = [{ ...old[0], doneAt: 1767225600000, total: 220, epMin: 23, genres: ['Action', 1, 'Comedy'], tier: 'Z' }];
  await page.setInputFiles('#fileIn', { name: 'yangi.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(neu)) });
  await page.locator('#ask').getByRole('button', { name: 'Ha, yuklash' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1'])[0]))
    .toMatchObject({ doneAt: 1767225600000, total: 220, epMin: 23, genres: ['Action', 'Comedy'], tier: '' });
});

test('doneAt holat sheet orqali', async ({ page }) => {
  await fresh(page);
  const row = page.locator('#list .row', { hasText: 'Yakka daraja oshirish' });   // done
  await row.locator('[data-status]').click();
  await page.locator('#ask').getByRole('button', { name: 'Ko‘rilmoqda' }).click();
  let it = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).find((x) => x.uz === 'Yakka daraja oshirish'));
  expect(it.doneAt).toBe(0);
  await row.locator('[data-status]').click();
  await page.locator('#ask').getByRole('button', { name: 'Ko‘rilgan' }).click();
  it = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).find((x) => x.uz === 'Yakka daraja oshirish'));
  expect(Date.now() - it.doneAt).toBeLessThan(10000);
});

test('jami qismlar maydoni saqlanadi', async ({ page }) => {
  await fresh(page);
  await page.locator('#list .row .uz', { hasText: 'Qora beda' }).click();
  // asl nomi bor yozuvda "Qo‘shimcha" o‘zi ochiq bo‘ladi
  if (!(await page.locator('#more').evaluate((d) => d.open))) await page.click('#more summary');
  await page.fill('#fTotal', '170'); await page.click('.sheet-foot button[type=submit]');
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).find((x) => x.uz === 'Qora beda').total)).toBe(170);
});

test('eksportda yangi maydonlar bor', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=export]')]);
  const data = JSON.parse(await fs.readFile(await dl.path(), 'utf8'));
  expect(Object.keys(data[0])).toEqual(expect.arrayContaining(['doneAt', 'total', 'epMin', 'genres', 'tier']));
});
