import { test, expect } from '@playwright/test';
import { fresh, freshBig, trapNativeDialogs } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await trapNativeDialogs(page); await freshBig(page); });

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
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  await page.clock.install();
  const id = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).find((x) => x.uz === 'Qora beda').id);
  await page.evaluate(([id, src]) => new Promise((res, rej) => {   // rasmni IndexedDB’ga qo‘yamiz
    const r = indexedDB.open('mening-royxatim', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('img');
    r.onsuccess = () => { const t = r.result.transaction('img', 'readwrite'); t.objectStore('img').put(src, id); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = rej; };
  }), [id, PNG]);
  await page.reload();
  const cover = page.locator('#list .row', { hasText: 'Qora beda' }).locator('img.cover');
  await expect(cover).toHaveAttribute('src', PNG);
  await page.locator('#list .row .uz', { hasText: 'Qora beda' }).click();
  await page.click('#delBtn');
  await expect(page.locator('#list .row')).toHaveCount(68);
  await page.locator('#toast').getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(page.locator('#list .row')).toHaveCount(69);
  await expect(page.locator('#list .row').nth(2)).toContainText('Qora beda');
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).map((x) => x.order)))
    .toEqual(Array.from({ length: 69 }, (_, i) => i + 1));
  await page.clock.runFor(6000);   // IndexedDB’dan o‘chirish muddati o‘tadi
  await page.reload();
  await expect(cover).toHaveAttribute('src', PNG);
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
  await expect(page.locator('#list .row')).toHaveCount(5);
  await expect(page.locator('#toast')).toContainText('Brauzer xotiraga yozishga ruxsat bermadi — o‘zgarishlar saqlanmaydi. Zaxira fayl oling.');
});

/* ---- Holat sheet’i → Tahrirlash: history buzilmasligi kerak ---- */
async function editViaStatusSheet(page) {
  await page.locator('#list .row', { hasText: 'Qora beda' }).locator('[data-status]').click();
  await page.locator('#ask').getByRole('button', { name: 'Tahrirlash' }).click();
  await expect(page.locator('#dlg')).toHaveJSProperty('open', true);
  await expect.poll(() => page.evaluate(() => history.state)).toEqual({ layer: 1 });
}

test('Tahrirlash’dan keyin × — ilovada qoladi', async ({ page }) => {
  await editViaStatusSheet(page);
  await page.click('#closeBtn');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
  await expect(page).toHaveURL(/localhost:5179\/$/);
  await expect(page.locator('#list .row')).toHaveCount(69);
});

test('Tahrirlash’dan keyin orqaga — oyna yopiladi, ilovada qoladi', async ({ page }) => {
  await editViaStatusSheet(page);
  await page.goBack();
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
  await expect(page).toHaveURL(/localhost:5179\/$/);
  await expect(page.locator('#list .row')).toHaveCount(69);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});

test('Tahrirlash’dan keyin O‘chirish — bekor qilish toast’i, ilovada qoladi', async ({ page }) => {
  await editViaStatusSheet(page);
  await page.click('#delBtn');
  await expect(page.locator('#toast').getByRole('button', { name: 'Bekor qilish' })).toBeVisible();
  await expect(page).toHaveURL(/localhost:5179\/$/);
  await expect(page.locator('#list .row')).toHaveCount(68);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});

test('askSheet varianti tanlanganda history toza', async ({ page }) => {
  await page.locator('#list .row [data-status]').first().click();
  await page.locator('#ask').getByRole('button', { name: 'Rejada' }).click();
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
  await page.click('#sortBtn');
  await page.locator('#ask').getByRole('button', { name: 'Nomi (A–Z)' }).click();
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
  await expect(page).toHaveURL(/localhost:5179\/$/);
});

test('bekor qilish muddati o‘tgach toast tugmasi qolmaydi', async ({ page }) => {
  await page.clock.install(); await page.reload();
  await page.locator('#list .row .uz', { hasText: 'Qora beda' }).click();
  await page.click('#delBtn');
  await expect(page.locator('#toast button')).toHaveCount(1);
  await page.clock.runFor(6000);
  await expect(page.locator('#toast button')).toHaveCount(0);
});
