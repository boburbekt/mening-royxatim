import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fresh, smallTargets, overflowX, pngSize } from './helpers.mjs';

test('tanlab joylash va saqlanishi', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  await page.locator('#page .tpool .tposter').first().click();
  const name = await page.locator('#page .tposter[aria-pressed=true]').getAttribute('aria-label');
  await page.locator('#page [data-tier=S]').click();
  await expect(page.locator('#page .trow[data-row=S] .tposter')).toHaveCount(1);
  expect(await page.evaluate((n) => JSON.parse(localStorage['mening-royxatim-v1']).find((x) => x.uz === n).tier, name)).toBe('S');
});

test('avto to‘ldirish', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  const tiers = await page.evaluate(() => Object.fromEntries(['S','A','B','C',''].map((t) => [t, items.filter((x) => (x.tier || '') === t && x.status !== 'plan').length])));
  expect(tiers.S).toBeGreaterThan(0); expect(tiers['']).toBe(0);
});

test('tier rasmi 1080×1350', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  await page.locator('#page').getByRole('button', { name: 'Rasm qilish' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#page').getByRole('button', { name: 'Yuklab olish' }).click()]);
  expect(pngSize(await fs.readFile(await dl.path()))).toEqual({ w: 1080, h: 1350 });
});

test('tier sahifasi mobil qoidalarga mos', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  expect(await smallTargets(page)).toEqual([]); expect(await overflowX(page)).toBeLessThanOrEqual(0);
});

test('tier sahifasi avto to‘ldirilgandan keyin ham mobil qoidalarga mos', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  expect(await smallTargets(page)).toEqual([]); expect(await overflowX(page)).toBeLessThanOrEqual(0);
});

test('tanlovni bekor qilish va havzaga qaytarish', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  const first = page.locator('#page .tpool .tposter').first();
  await first.click(); await expect(page.locator('#page .tposter[aria-pressed=true]')).toHaveCount(1);
  await page.locator('#page .tposter[aria-pressed=true]').click(); await expect(page.locator('#page .tposter[aria-pressed=true]')).toHaveCount(0);
  const n = await page.locator('#page .tpool .tposter').count();
  await first.click(); await page.locator('#page [data-tier=A]').click();
  await expect(page.locator('#page .tpool .tposter')).toHaveCount(n - 1);
  await page.locator('#page .trow[data-row=A] .tposter').click(); await page.locator('#page [data-pool]').click();
  await expect(page.locator('#page .tpool .tposter')).toHaveCount(n);
  await expect(page.locator('#page .trow .tposter')).toHaveCount(0);
});
