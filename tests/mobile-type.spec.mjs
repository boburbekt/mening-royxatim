import { test, expect } from '@playwright/test';
import { fresh, freshBig, overflowX } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await freshBig(page); });

test('iOS zoom yo‘q: maydonlar ≥16px', async ({ page }) => {
  await page.click('#fab'); await page.click('#more summary');
  const small = await page.evaluate(() => [...document.querySelectorAll('input:not([type=file]),select,textarea')]
    .filter((el) => el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 16).map((el) => el.id));
  expect(small).toEqual([]);
});

test('shrift o‘lchamlari ≤ 6', async ({ page }) => {
  const sizes = async () => page.evaluate(() => [...document.querySelectorAll('body *')]
    .filter((el) => el.getClientRects().length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .map((el) => getComputedStyle(el).fontSize));
  const all = new Set(await sizes());
  await page.click('#fab'); (await sizes()).forEach((s) => all.add(s));
  expect([...all].length).toBeLessThanOrEqual(6);
});

test('emoji ikonkalar yo‘q', async ({ page }) => {
  expect(await page.evaluate(() => document.body.textContent.match(/\p{Extended_Pictographic}/gu))).toBeNull();
});

test('boshqaruv yorliqlari kesilmaydi', async ({ page }) => {
  for (const open of [null, '#fab']) {
    if (open) await page.click(open);
    const cut = await page.evaluate(() => [...document.querySelectorAll('button, [role=tab], label.opt span, select, .lbl')]
      .filter((el) => el.getClientRects().length && el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim()));
    expect(cut).toEqual([]);
  }
});

test('uzun nom 2 qator', async ({ page }) => {
  const uz = page.locator('#list .row .uz', { hasText: 'Zindon tubida' });
  const { h, lh } = await uz.evaluate((el) => ({ h: el.clientHeight, lh: parseFloat(getComputedStyle(el).lineHeight) }));
  expect(h).toBeLessThanOrEqual(2 * lh + 1);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
});

test('bo‘sh nomda saqlash aria-disabled', async ({ page }) => {
  await page.click('#fab');
  const btn = page.locator('.sheet-foot button[type=submit]');
  await expect(btn).toHaveAttribute('aria-disabled', 'true');
  await btn.click({ force: true });
  await expect(page.locator('.toast')).toContainText('Nomini yozing');
  await page.fill('#fUz', 'X');
  await expect(btn).not.toHaveAttribute('aria-disabled', 'true');
});
