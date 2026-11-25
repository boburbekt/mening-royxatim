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

test('birlashtirish: yangiroq fayl bo‘sh maydonlari mening tier/total/epMin/janr/doneAt ni o‘chirmaydi', async ({ page }) => {
  await seedItems(page, [
    base({ id: 'm1', uz: 'Naruto', tier: 'S', total: 28, epMin: 24, genres: ['Drama'], doneAt: 111, updated: 100 }),
    base({ id: 'm2', order: 2, uz: 'Bleach', tier: 'A', total: 10, doneAt: 222, updated: 100 })]);
  await page.goto('/');
  await merged(page, [
    base({ id: 'm1', uz: 'Naruto', rating: 9, updated: 200 }),
    base({ id: 'm2', uz: 'Bleach', status: 'watching', tier: 'B', total: 12, epMin: 20, genres: ['Action'], updated: 200 })]);
  const v = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).map(({ rating, tier, total, epMin, genres, doneAt, status }) => ({ rating, tier, total, epMin, genres, doneAt, status })));
  expect(v).toEqual([
    { rating: 9, tier: 'S', total: 28, epMin: 24, genres: ['Drama'], doneAt: 111, status: 'done' },
    { rating: 0, tier: 'B', total: 12, epMin: 20, genres: ['Action'], doneAt: 0, status: 'watching' }]);
});

const evilId = 'q"><img src=x onerror="window.__xss=1">';
const evilOrder = '1<img src=x onerror=window.__xss=2>';
for (const how of ['Yangilash (birlashtirish)', 'Almashtirish']) {
  test(`zaxiradagi id va order HTML sifatida ishlamaydi (${how})`, async ({ page }) => {
    await fresh(page);
    await send(page, [base({ id: evilId, order: evilOrder, uz: 'Xavfli yozuv', updated: 5 })]);
    await page.locator('#ask').getByRole('button', { name: how }).click();
    await expect(page.locator('#toast')).toHaveClass(/show/);
    await page.reload();
    for (const view of ['list', 'grid']) {
      await page.evaluate((v) => { state.view = v; renderList(); }, view);
      await expect(page.locator('#list [data-id]', { hasText: 'Xavfli yozuv' })).toHaveCount(1);
      await page.waitForTimeout(100);
      expect(await page.evaluate(() => window.__xss)).toBeUndefined();
      expect(await page.locator('#list img[src=x]').count()).toBe(0);
    }
    const it = await page.evaluate(() => items.find((x) => x.uz === 'Xavfli yozuv'));
    expect(it.id).toBe(evilId);
    expect(Number.isInteger(it.order) && it.order > 0).toBe(true);
    await expect(page.locator('#list [data-id]', { hasText: 'Xavfli yozuv' })).toHaveAttribute('data-id', evilId);
  });
}

test('normalizeItem: id, order va updated tozalanadi, mavjud string id o‘zgarmaydi', async ({ page }) => {
  await fresh(page);
  const r = await page.evaluate(() => [
    normalizeItem({ id: 'abc123', order: 4, uz: 'A', status: 'done', updated: 1700 }, 0),
    normalizeItem({ id: { x: 1 }, order: '2<b>', uz: 'B', status: 'done', updated: 'x' }, 2),
    normalizeItem({ id: '', order: -3, uz: 'C', status: 'done', updated: -5 }, 6)].map((x) => [typeof x.id, x.id.length > 0, x.order, x.updated]));
  expect(r).toEqual([['string', true, 4, 1700], ['string', true, 3, 0], ['string', true, 7, 0]]);
  expect(await page.evaluate(() => normalizeItem({ id: 'abc123', uz: 'A', status: 'done' }, 0).id)).toBe('abc123');
});
