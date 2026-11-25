import { test, expect } from '@playwright/test';
import { fresh, seedItems } from './helpers.mjs';

const base = (o) => ({ order: 1, title: '', type: 'Anime', status: 'done', rating: 0, progress: '', note: '', updated: 0, ...o });
const send = (page, data) => page.setInputFiles('#fileIn', { name: 'z.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });

test('birlashtirish: yangiroq olinadi, yangisi qo‘shiladi, meniki qoladi', async ({ page }) => {
  await seedItems(page, [
    base({ id: 'a', uz: 'Naruto', rating: 7, updated: 100 }),
    base({ id: 'b', order: 2, uz: 'Bleach', rating: 9, updated: 500 }),
    base({ id: 'c', order: 3, uz: 'Faqat menda', updated: 1 })]);
  await page.goto('/');
  const file = [
    base({ id: 'a', uz: 'Naruto', rating: 9, updated: 200, img: 'data:image/png;base64,iVBORw0KGgo=' }),
    base({ id: 'zz', uz: 'BLEACH', rating: 5, updated: 300 }),
    base({ id: 'n', uz: 'Yangi anime', updated: 50, img: 'data:image/png;base64,iVBORw0KGgo=' })];
  await send(page, file);
  await page.locator('#ask').getByRole('button', { name: 'Yangilash (birlashtirish)' }).click();
  const v = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']));
  expect(v.map((x) => [x.uz, x.rating])).toEqual([['Naruto', 9], ['Bleach', 9], ['Faqat menda', 0], ['Yangi anime', 0]]);
  await expect(page.locator('#toast')).toContainText('+1 yangi, 1 ta yangilandi');
  await page.reload();
  expect(await page.evaluate(() => [IMG.has('a'), IMG.has('n')])).toEqual([true, true]);
});

test('birlashtirish: nom bo‘yicha mos kelganda mening id va rasm kaliti qoladi', async ({ page }) => {
  await seedItems(page, [base({ id: 'a', uz: 'Naruto', rating: 1, updated: 10 })]);
  await page.goto('/');
  await send(page, [base({ id: 'other', uz: ' naruto ', rating: 6, updated: 20, img: 'data:image/png;base64,iVBORw0KGgo=' })]);
  await page.locator('#ask').getByRole('button', { name: 'Yangilash (birlashtirish)' }).click();
  expect(await page.evaluate(() => [items.length, items[0].id, items[0].rating, IMG.has('a'), IMG.has('other')])).toEqual([1, 'a', 6, true, false]);
});

test('almashtirish avvalgidek', async ({ page }) => {
  await fresh(page);
  await send(page, [base({ id: 'x', uz: 'Yolg‘iz' })]);
  await page.locator('#ask').getByRole('button', { name: 'Almashtirish' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).length)).toBe(1);
});

test('qurilmadan qurilmaga: eksport → boshqa qurilmada yangilash (rasmlar bilan)', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage(); await fresh(a);
  await a.evaluate(() => { setImage(items[0].id, 'data:image/png;base64,iVBORw0KGgo='); items[0].rating = 3; items[0].updated = Date.now(); save(); });
  await a.click('#menuBtn');
  const [dl] = await Promise.all([a.waitForEvent('download'), a.click('[data-act=export]')]);
  const b = await (await browser.newContext()).newPage(); await fresh(b);
  await b.setInputFiles('#fileIn', await dl.path());
  await b.locator('#ask').getByRole('button', { name: 'Yangilash (birlashtirish)' }).click();
  expect(await b.evaluate(() => [items[0].rating, IMG.has(items[0].id), items.length])).toEqual([3, true, 69]);
});

test('baho 0..10 oralig‘iga keltiriladi', async ({ page }) => {
  await fresh(page);
  await send(page, [base({ id: 'p', uz: 'A', rating: 100 }), base({ id: 'q', order: 2, uz: 'B', rating: -3 }), base({ id: 'r', order: 3, uz: 'C', rating: 'x' })]);
  await page.locator('#ask').getByRole('button', { name: 'Almashtirish' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).map((x) => x.rating))).toEqual([10, 0, 0]);
});

const merged = async (page, file) => {
  await send(page, file);
  await page.locator('#ask').getByRole('button', { name: 'Yangilash (birlashtirish)' }).click();
  return page.evaluate(() => items.map((x) => [x.id, x.type, x.rating]));
};

test('birlashtirish: bir xil nomli Anime va Manga bir-birini bosib ketmaydi', async ({ page }) => {
  await seedItems(page, [base({ id: 'm1', uz: 'Berserk', rating: 8, updated: 10 }), base({ id: 'm2', order: 2, uz: 'Berserk', type: 'Manga', rating: 10, updated: 10 })]);
  await page.goto('/');
  const r = await merged(page, [base({ id: 'f1', uz: 'Berserk', rating: 9, updated: 20 }), base({ id: 'f2', uz: 'Berserk', type: 'Manga', rating: 9, updated: 30 })]);
  expect(r).toEqual([['m1', 'Anime', 9], ['m2', 'Manga', 9]]);
});

test('birlashtirish: boshqa turdagi bir xil nom yangi yozuv bo‘lib qo‘shiladi', async ({ page }) => {
  await seedItems(page, [base({ id: 'm1', uz: 'Berserk', rating: 8, updated: 10 })]);
  await page.goto('/');
  const r = await merged(page, [base({ id: 'f1', uz: 'Berserk', rating: 5, updated: 5 }), base({ id: 'f2', uz: 'Berserk', type: 'Manga', rating: 9, updated: 30 })]);
  expect(r).toEqual([['m1', 'Anime', 8], ['f2', 'Manga', 9]]);
});

test('birlashtirish: fayldagi bir xil id lar ikkalasi ham qo‘shiladi', async ({ page }) => {
  await seedItems(page, [base({ id: 'm1', uz: 'Menda', updated: 10 })]);
  await page.goto('/');
  const r = await merged(page, [base({ id: 'd', uz: 'Bir' }), base({ id: 'd', order: 2, uz: 'Ikki' })]);
  expect(r.length).toBe(3);
  expect(new Set(r.map((x) => x[0])).size).toBe(3);
});

test('birlashtirish: meniki qolganda tier bo‘sh bo‘lsa fayldagi tier olinadi', async ({ page }) => {
  await seedItems(page, [base({ id: 'm1', uz: 'Naruto', updated: 100, tier: '' }), base({ id: 'm2', order: 2, uz: 'Bleach', updated: 100, tier: 'B' })]);
  await page.goto('/');
  await merged(page, [base({ id: 'm1', uz: 'Naruto', updated: 50, tier: 'S' }), base({ id: 'm2', uz: 'Bleach', updated: 50, tier: 'A' })]);
  expect(await page.evaluate(() => items.map((x) => x.tier))).toEqual(['S', 'B']);
});
