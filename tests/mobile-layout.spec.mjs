import { test, expect } from '@playwright/test';
import { fresh, freshBig, overflowX, smallTargets } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshBig(page); });

test('ro‘yxat birinchi: birinchi qator y ≤ 200', async ({ page }) => {
  const box = await page.locator('#list .row').first().boundingBox();
  expect(box.y).toBeLessThanOrEqual(200);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
});

test('holat tablari', async ({ page }) => {
  await expect(page.locator('#tabs [role=tab]')).toHaveText(['Hammasi 69', 'Ko‘rilgan 62', 'Ko‘rilmoqda 6', 'Rejada 1']);
  await page.getByRole('tab', { name: /Ko‘rilmoqda/ }).click();
  await expect(page.locator('#list .row')).toHaveCount(6);
  await expect(page.getByRole('tab', { name: /Ko‘rilmoqda/ })).toHaveAttribute('aria-selected', 'true');
});

test('tablar yopishqoq', async ({ page }) => {
  await page.evaluate(() => scrollTo(0, 2000));
  await expect.poll(async () => (await page.locator('#tabs').boundingBox()).y).toBeLessThanOrEqual(1);
});

test('statistika yig‘ilgan va ochiladi', async ({ page }) => {
  await expect(page.locator('#overview')).toBeHidden();
  await page.click('#statsBtn');
  await expect(page.locator('#statsBtn')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#overview')).toContainText('O‘rtacha baho');
  await page.locator('#dist .bar[data-r="10"]').click();
  await expect(page.locator('#list .row').first()).toContainText('/10');
  await expect(page.locator('#count')).toBeVisible();
});

test('saralash tugmasi', async ({ page }) => {
  await page.click('#sortBtn');
  await page.locator('#ask').getByRole('button', { name: 'Nomi (A–Z)' }).click();
  const names = await page.locator('#list .row .uz').allTextContents();
  expect(names.slice(0, 3)).toEqual([...names].sort((a, b) => a.localeCompare(b, 'uz')).slice(0, 3));
});

test('tozalash tugmasi va bo‘sh natija', async ({ page }) => {
  await expect(page.locator('#count')).toBeHidden();
  await page.fill('#q', 'zzzzqq');
  await expect(page.locator('#list .empty .clear')).toBeVisible();
  await expect(page.locator('#count .clear')).toBeVisible();
  await page.locator('#list .empty .clear').click();
  await expect(page.locator('#list .row')).toHaveCount(69);
  await expect(page.locator('#count')).toBeHidden();
});

test('yangi mobil nishonlar 44px', async ({ page }) => {
  await page.fill('#q', 'a');
  const bad = (await smallTargets(page)).filter((t) => /statsBtn|sortBtn|tabs|clear|\[role=tab\]/.test(t.sel) || t.sel.includes('#tabs'));
  expect(bad).toEqual([]);
  const tabs = await page.locator('#tabs [role=tab]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  tabs.forEach((h) => expect(h).toBeGreaterThanOrEqual(44));
});
