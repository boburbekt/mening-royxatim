import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fresh, freshBig, overflowX } from './helpers.mjs';

test('birinchi ochilishda 5 ta boshlang‘ich anime, rasmlari bilan', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('#list .row')).toHaveCount(5);
  await expect(page.locator('#list .row .uz')).toHaveText(['Yakka daraja oshirish', 'Friren: Sayohat yakunidan so‘ng', 'Qora beda', 'Shilliq sifatida qayta tug‘ilganim haqida', 'Arra odam']);
  await expect(page.locator('#list .row img.cover')).toHaveCount(5);
  for (const src of await page.locator('#list .row img.cover').evaluateAll((els) => els.map((e) => e.getAttribute('src')))) expect(src).toMatch(/^data:image\/jpeg/);
  expect(await page.evaluate(() => Object.keys(localStorage))).toContain('mening-royxatim-v1');
  // rasmlar IndexedDB’ga yozilgan: qayta ochilganda ham turadi
  await page.reload();
  await expect(page.locator('#list .row img.cover')).toHaveCount(5);
});

test('mavjud ma’lumot saqlanadi', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.seeded) return; sessionStorage.seeded = 1;
    localStorage.setItem('mening-royxatim-v1', JSON.stringify([
      { id: 'a1', order: 1, title: 'X', uz: 'Sinov A', type: 'Manga', status: 'plan', rating: 0, progress: '', note: '', updated: 0 },
      { id: 'b2', order: 2, title: '', uz: 'Sinov B', type: 'Kino', status: 'done', rating: 7, progress: '', note: '', updated: 0 }]));
    localStorage.setItem('mening-royxatim-view', 'grid');
  });
  await page.goto('/');
  await expect(page.locator('#list .card')).toHaveCount(2);
  await expect(page.locator('#list')).toContainText('Sinov A');
});

test('zaxira fayl formati', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('#list .row img.cover')).toHaveCount(5);
  await page.click('#menuBtn');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=export]')]);
  expect(dl.suggestedFilename()).toMatch(/^mening-royxatim-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(await fs.readFile(await dl.path(), 'utf8'));
  expect(data).toHaveLength(5);
  expect(Object.keys(data[0]).sort()).toEqual(['doneAt','epMin','genres','id','img','note','order','progress','rating','status','tier','title','total','type','updated','uz']);
  expect(data.every((x) => x.img.startsWith('data:image/'))).toBe(true);
});

test('desktop tuzilmasi o‘zgarmagan', async ({ page }) => {
  await freshBig(page);
  await expect(page.locator('#stats .stat')).toHaveCount(5);   // Jami, 3 holat, O‘rtacha
  await expect(page.locator('#dist .bar')).toHaveCount(10);
  for (const s of ['#stats', '#dist', '#sort', '#addBtn']) await expect(page.locator(s)).toBeVisible();
  await expect(page.locator('#fab')).toBeHidden();
  for (const s of ['#tabs', '#statsBtn', '#sortBtn']) await expect(page.locator(s)).toBeHidden();
  const barH = await page.locator('#dist .bar i').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  expect(barH).toEqual([2, 2, 2, 3, 3, 20, 30, 30, 30, 30]);   // eski inline px balandliklar bilan bir xil
  const cols = await page.locator('#list .row').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols).toBe(6);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
});
