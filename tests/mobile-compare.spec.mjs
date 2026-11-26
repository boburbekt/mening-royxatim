import { test, expect } from '@playwright/test';
import { fresh, freshBig, smallTargets, overflowX, cutLabels } from './helpers.mjs';

const friend = [
  { id: 'f1', order: 1, title: 'Black Clover', uz: 'QORA  BEDA', type: 'Anime', status: 'done', rating: 9, progress: '', note: '', updated: 0 },
  { id: 'f2', order: 2, title: 'Naruto', uz: 'Naruto', type: 'Anime', status: 'done', rating: 10, progress: '', note: '', updated: 0 },
  { id: 'f3', order: 3, title: 'Bleach', uz: 'Bleach', type: 'Anime', status: 'plan', rating: 0, progress: '', note: '', updated: 0 }];

const upload = (page, data = friend) => page.setInputFiles('#friendIn', { name: 'dost.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
const lsLen = (page) => page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).length);

test('nomlar normallashtiriladi va moslik', async ({ page }) => {
  await freshBig(page);
  const r = await page.evaluate((f) => { const c = compareLists(items, f); return { both: c.both.length, of: c.onlyFriend.map((x) => x.uz), match: c.match }; }, friend);
  expect(r.both).toBe(1); expect(r.of).toEqual(['Naruto']); expect(r.match).toBe(90);   // 10 vs 9
});

test('keysOf: bo‘sh va takrorlanganlar olib tashlanadi', async ({ page }) => {
  await freshBig(page);
  const r = await page.evaluate(() => [keysOf({ title: 'Naruto', uz: ' NARUTO ' }), keysOf({ title: '', uz: 'Qora  Beda' })]);
  expect(r).toEqual([['naruto'], ['qora beda']]);
});

test('fayldan solishtirish va rejaga qo‘shish', async ({ page }) => {
  await freshBig(page); await page.click('#menuBtn'); await page.click('[data-act=compare]');
  await upload(page);
  await expect(page.locator('#page')).toContainText('Did mosligi: 90%');
  await page.locator('#page').getByRole('button', { name: /U ko‘rgan/ }).click();
  await page.locator('#page').getByRole('button', { name: '+ Rejaga' }).click();
  const last = await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).at(-1));
  expect(last).toMatchObject({ uz: 'Naruto', status: 'plan', rating: 0 });
  expect(await lsLen(page)).toBe(70);
  const btn = page.locator('#page').getByRole('button', { name: 'Qo‘shildi' });
  await expect(btn).toHaveAttribute('aria-disabled', 'true');
  await btn.click({ force: true });
  expect(await lsLen(page)).toBe(70);
});

test('rejada bor yozuv takror qo‘shilmaydi', async ({ page }) => {
  await freshBig(page);
  await page.evaluate(() => { items.push({ id: 'mine-plan', order: 99, title: '', uz: 'Naruto', type: 'Anime', status: 'plan', rating: 0, progress: '', note: '', updated: 0 }); save(); });
  await page.click('#menuBtn'); await page.click('[data-act=compare]');
  await upload(page);
  await page.locator('#page').getByRole('button', { name: /U ko‘rgan/ }).click();
  await page.locator('#page').getByRole('button', { name: '+ Rejaga' }).click();
  await expect(page.locator('#toast')).toContainText('Ro‘yxatingda bor');
  expect(await lsLen(page)).toBe(70);
});

test('do‘st rasmi (data:) rejaga qo‘shilganda saqlanadi', async ({ page }) => {
  await freshBig(page); await page.click('#menuBtn'); await page.click('[data-act=compare]');
  const img = 'data:image/png;base64,iVBORw0KGgo=';
  await upload(page, [{ ...friend[1], img }]);
  await page.locator('#page').getByRole('button', { name: /U ko‘rgan/ }).click();
  await page.locator('#page').getByRole('button', { name: '+ Rejaga' }).click();
  expect(await page.evaluate((i) => IMG.get(items.at(-1).id) === i, img)).toBe(true);
});

test('noto‘g‘ri do‘st fayli', async ({ page }) => {
  await freshBig(page); await page.click('#menuBtn'); await page.click('[data-act=compare]');
  await page.setInputFiles('#friendIn', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('[1]') });
  await expect(page.locator('#toast')).toContainText('do‘stingning zaxira faylini');
  expect(await lsLen(page)).toBe(69);
});

test('solishtirish sahifasi mobil qoidalarga mos', async ({ page }) => {
  await freshBig(page); await page.click('#menuBtn'); await page.click('[data-act=compare]');
  await upload(page);
  await expect(page.locator('#page')).toContainText('Did mosligi');
  expect(await smallTargets(page)).toEqual([]); expect(await overflowX(page)).toBeLessThanOrEqual(0);
  expect(await cutLabels(page)).toEqual([]);
  await page.locator('#page').getByRole('button', { name: /U ko‘rgan/ }).click();
  expect(await smallTargets(page)).toEqual([]); expect(await cutLabels(page)).toEqual([]);
  await page.locator('#page').getByRole('button', { name: /Men ko‘rgan/ }).click();
  expect(await smallTargets(page)).toEqual([]); expect(await overflowX(page)).toBeLessThanOrEqual(0);
  const sizes = await page.locator('#page *').evaluateAll((els) => [...new Set(els.filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => getComputedStyle(e).fontSize))]);
  for (const s of sizes) expect(['12px', '13px', '15px', '16px', '20px']).toContain(s);
});

test('zaxirani ulashish menyusi: canShare bo‘lmasa yashirin', async ({ page }) => {
  await freshBig(page);
  await expect(page.locator('[data-act=shareBackup]')).toBeHidden();
  await page.addInitScript(() => { navigator.canShare = () => true; navigator.share = async (d) => { window.__shared = d; throw new DOMException('x', 'AbortError'); }; });
  await page.reload();
  await page.click('#menuBtn');
  await expect(page.locator('[data-act=shareBackup]')).toBeVisible();
  await page.click('[data-act=shareBackup]');
  await expect.poll(() => page.evaluate(() => window.__shared?.files?.[0]?.type)).toBe('application/json');
  expect(await page.evaluate(() => window.__shared.title)).toBe('Mening ro‘yxatim — zaxira');
  await expect(page.locator('#toast')).not.toHaveClass(/show/);
});

test('solishtirish turi bo‘yicha: boshqa turdagi bir xil nom mos kelmaydi va rejaga qo‘shiladi', async ({ page }) => {
  await freshBig(page);
  await page.evaluate(() => { items.push({ id: 'my-naruto', order: 99, title: '', uz: 'Naruto', type: 'Anime', status: 'done', rating: 8, progress: '', note: '', updated: 0 }); save(); });
  const mangaNaruto = { ...friend[1], id: 'fm', type: 'Manga', rating: 7 };
  const r = await page.evaluate((f) => { const c = compareLists(items, f); return { both: c.both.length, of: c.onlyFriend.map((x) => x.type) }; }, [mangaNaruto]);
  expect(r).toEqual({ both: 0, of: ['Manga'] });
  await page.click('#menuBtn'); await page.click('[data-act=compare]');
  await upload(page, [mangaNaruto]);
  await page.locator('#page').getByRole('button', { name: /U ko‘rgan/ }).click();
  await page.locator('#page').getByRole('button', { name: '+ Rejaga' }).click();
  await expect(page.locator('#toast')).toContainText('Rejaga qo‘shildi');
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).at(-1))).toMatchObject({ uz: 'Naruto', type: 'Manga', status: 'plan' });
});
