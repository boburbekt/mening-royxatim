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

const mk = (n, rating, off) => Array.from({ length: n }, (_, i) => ({ id: `t${rating}-${off}-${i}`, order: off + i, title: `T${off + i}`, uz: `Nom ${rating}-${i}`, type: 'Anime', status: 'done', rating, progress: '', note: '', updated: 0, tier: '' }));
async function cardInfo(page, list) {
  const { seedItems } = await import('./helpers.mjs');
  await seedItems(page, list); await page.goto('/');
  return page.evaluate(async () => {
    items.forEach((it) => { const r = it.rating; it.tier = r >= 10 ? 'S' : r === 9 ? 'A' : r >= 7 ? 'B' : 'C'; });
    return (await drawTierCard()).tierInfo;
  });
}
const within = (info) => { for (const r of info.rows) { expect(r.y + r.h).toBeLessThanOrEqual(info.footerY - 20); expect(r.bottom).toBeLessThanOrEqual(r.y + r.h + 0.5); } expect(info.endY).toBeLessThanOrEqual(info.h - 40); };

test('200 yozuv: hamma qator rasm ichida, S da +N', async ({ page }) => {
  const info = await cardInfo(page, [...mk(200, 10, 0), ...mk(3, 9, 300), ...mk(3, 7, 400), ...mk(3, 5, 500)]);
  within(info); expect(info.rows[0].more).toBeGreaterThan(0);
  expect(info.rows.map((r) => r.tier)).toEqual(['S', 'A', 'B', 'C']);
});

test('o‘rtacha ro‘yxat: 120px minimum hisobga olinadi', async ({ page }) => {
  const info = await cardInfo(page, [...mk(60, 10, 0), ...mk(40, 9, 100), ...mk(2, 7, 200), ...mk(2, 5, 300)]);
  within(info);
});

test('rasm tayyorlashda xato: yuklanmoqda yozuvi qolmaydi, toast chiqadi', async ({ page }) => {
  await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]');
  await page.evaluate(() => { HTMLCanvasElement.prototype.toDataURL = () => { throw new Error('SecurityError'); }; });
  await page.locator('#page').getByRole('button', { name: 'Rasm qilish' }).click();
  await expect(page.locator('#toast')).toContainText('Rasmni tayyorlab bo‘lmadi');
  await expect(page.locator('#page .share-load')).toHaveCount(0);
});

const openTier = async (page) => { await fresh(page); await page.click('#menuBtn'); await page.click('[data-act=tier]'); };
const tierOf = (page, n) => page.evaluate((n) => JSON.parse(localStorage['mening-royxatim-v1']).find((x) => x.uz === n).tier, n);

test('sichqoncha bilan sudrab joylash', async ({ page }) => {
  await openTier(page);
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  // A qatorining boshi ekranda ko‘rinsin (320px da u pastda qoladi)
  await page.evaluate(() => { const b = document.querySelector('#pageBody'), a = document.querySelector('#page [data-drop=A]'); b.scrollTop += a.getBoundingClientRect().top - 360; });
  const src = page.locator('#page .trow[data-row=S] .tposter').last();
  const name = await src.getAttribute('aria-label');
  const before = await page.locator('#page .trow[data-row=A] .tposter').count();
  const a = await src.boundingBox(), b = await page.locator('#page [data-drop=A]').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + 30, a.y + 30, { steps: 3 });
  await page.mouse.move(b.x + b.width / 2, b.y + 40, { steps: 8 });
  await expect(page.locator('#page .tghost')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('#page .tghost')).toHaveCount(0);
  await expect(page.locator('#page .trow[data-row=A] .tposter')).toHaveCount(before + 1);
  expect(await tierOf(page, name)).toBe('A');
  await expect(page.locator('#page .tposter[aria-pressed=true]')).toHaveCount(0); // sudrash tanlovga aylanmaydi
});

test('barmoq bilan bosib turib sudrash, tez surish esa aylantirish', async ({ page }) => {
  await openTier(page);
  const src = page.locator('#page .tpool .tposter').first();
  const name = await src.getAttribute('aria-label');
  const a = await src.boundingBox(), b = await page.locator('#page [data-drop=S]').boundingBox();
  const ev = (type, target, x, y) => page.evaluate(([type, sel, x, y]) => {
    const el = sel ? document.querySelector(sel) : window;
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
  }, [type, target, x, y]);
  const sx = a.x + a.width / 2, sy = a.y + a.height / 2;
  // tez surish: drag boshlanmaydi
  await ev('pointerdown', '#page .tpool .tposter', sx, sy);
  await ev('pointermove', null, sx, sy - 40);
  await page.waitForTimeout(350);
  await expect(page.locator('#page .tghost')).toHaveCount(0);
  await ev('pointerup', null, sx, sy - 40);
  // bosib turish: drag boshlanadi
  await ev('pointerdown', '#page .tpool .tposter', sx, sy);
  await page.waitForTimeout(350);
  await expect(page.locator('#page .tghost')).toHaveCount(1);
  await ev('pointermove', null, b.x + b.width / 2, b.y + b.height / 2);
  await ev('pointerup', null, b.x + b.width / 2, b.y + b.height / 2);
  expect(await tierOf(page, name)).toBe('S');
});

test('tozalash va bekor qilish', async ({ page }) => {
  await openTier(page);
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  await page.locator('#page').getByRole('button', { name: 'Tozalash' }).click();
  await page.locator('#ask').getByRole('button', { name: 'Ha, tozalash' }).click();
  await expect(page.locator('#page .trow .tposter')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).some((x) => x.tier))).toBe(false);
  await page.locator('#toast').getByRole('button', { name: 'Bekor qilish' }).click();
  await expect(page.locator('#page .trow[data-row=S] .tposter').first()).toBeVisible();
});

test('avto to‘ldirish: hammasini qaytadan joylash', async ({ page }) => {
  await openTier(page);
  const name = await page.locator('#page .tpool .tposter').first().getAttribute('aria-label'); // eng yuqori baho → S
  await page.locator('#page .tpool .tposter').first().click(); await page.locator('#page [data-tier=C]').click();
  expect(await tierOf(page, name)).toBe('C');
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  await page.locator('#ask').getByRole('button', { name: 'Faqat joylanmaganlarni' }).click();
  expect(await tierOf(page, name)).toBe('C');
  await page.locator('#page').getByRole('button', { name: 'Avto to‘ldirish' }).click();
  await page.locator('#ask').getByRole('button', { name: 'Hammasini qaytadan joylash' }).click();
  expect(await tierOf(page, name)).toBe('S');
});
