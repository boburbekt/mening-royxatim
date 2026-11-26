import { test, expect } from '@playwright/test';
import { fresh } from './helpers.mjs';

test('manifest va ikonkalar', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const m = await (await request.get(href)).json();
  expect(m).toMatchObject({ short_name: 'Ro‘yxatim', display: 'standalone', start_url: './' });
  expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const i of m.icons) expect((await request.get(i.src)).status()).toBe(200);
  expect((await request.get(await page.locator('link[rel=apple-touch-icon]').getAttribute('href'))).status()).toBe(200);
});

test('oflayn qayta yuklash', async ({ page, context }) => {
  await fresh(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();               // SW endi sahifani boshqaradi
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#list .row')).toHaveCount(5);
  await expect(page.locator('#list .row img.cover')).toHaveCount(5);
});

test('halol matnlar', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn');
  await expect(page.locator('.menu-list')).toContainText('faqat shu qurilmadagi brauzerda');
  expect(await page.evaluate(() => document.body.innerText.includes('JSON'))).toBe(false);
});

test('kamaytirilgan harakat', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await fresh(page);
  expect(await page.locator('#toast').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
});
