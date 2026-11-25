import { test, expect } from '@playwright/test';
import { fresh, trapNativeDialogs } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await trapNativeDialogs(page); await fresh(page); });

test('brauzer dialoglari ishlatilmaydi', async ({ page }) => {
  await page.locator('#list .row .uz').nth(2).click(); await page.click('#delBtn');
  await page.click('#menuBtn'); await page.click('[data-act=reset]');
  await expect(page.locator('#ask')).toHaveJSProperty('open', true);
  await page.locator('#ask').getByRole('button', { name: 'Bekor qilish' }).click();
  await page.setInputFiles('#fileIn', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('nope') });
  await expect(page.locator('#toast')).toContainText('mos emas');
  expect(await page.evaluate(() => window.__native)).toEqual([]);
});

test('o‘chirish va bekor qilish', async ({ page }) => {
  await page.locator('#list .row .uz', { hasText: 'Qora beda' }).click();
  await page.click('#delBtn');
  await expect(page.locator('#list .row')).toHaveCount(68);
  await page.locator('#toast').getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(page.locator('#list .row')).toHaveCount(69);
  await expect(page.locator('#list .row').nth(2)).toContainText('Qora beda');
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).map((x) => x.order)))
    .toEqual(Array.from({ length: 69 }, (_, i) => i + 1));
});

test('yashirin toast bosilmaydi', async ({ page }) => {
  await page.locator('#list .row .uz').nth(2).click(); await page.click('#delBtn');
  await expect(page.locator('#toast button')).toBeVisible();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('#toast')).pointerEvents)).toBe('auto');
  await page.evaluate(() => document.querySelector('#toast').classList.remove('show'));
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#toast button')).pointerEvents)).toBe('none');
});

test('orqaga tugmasi oynani yopadi', async ({ page }) => {
  await page.click('#fab'); await expect(page.locator('#dlg')).toHaveJSProperty('open', true);
  await page.goBack(); await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
  await expect(page).toHaveURL(/localhost:5179\/$/);
});

test('× bilan yopilganda history toza qoladi', async ({ page }) => {
  await page.click('#fab'); await page.click('#closeBtn');
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});

test('Esc bilan yopilganda history toza qoladi', async ({ page }) => {
  await page.click('#fab'); await page.keyboard.press('Escape');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});

test('yana + dan keyin orqaga', async ({ page }) => {
  await page.click('#fab'); await page.fill('#fUz', 'Sinov'); await page.click('#againBtn');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', true);
  await page.goBack(); await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});

test('askSheet orqaga bilan yopiladi', async ({ page }) => {
  await page.click('#menuBtn'); await page.click('[data-act=reset]');
  await expect(page.locator('#ask')).toHaveJSProperty('open', true);
  await page.goBack();
  await expect(page.locator('#ask')).toHaveJSProperty('open', false);
  await expect(page.locator('#list .row')).toHaveCount(69);
});

test('xotira bloklanganda ilova ishga tushadi', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.goto('/');
  await expect(page.locator('#list .row')).toHaveCount(69);
  await expect(page.locator('#toast')).toContainText('Brauzer xotiraga yozishga ruxsat bermadi — o‘zgarishlar saqlanmaydi. Zaxira fayl oling.');
});
