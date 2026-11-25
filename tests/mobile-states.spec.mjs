import { test, expect } from '@playwright/test';
import { fresh, overflowX, cutLabels } from './helpers.mjs';

// 5 turdan yozuvlar: tur chiplari ko‘rinadi (5 ta tur + "Hammasi")
const TYPES = ['Anime', 'Manga', 'Manhva', 'Kino', 'Serial'];
const MULTI = TYPES.flatMap((type, t) => [0, 1].map((k) => ({
  id: `m${t}${k}`, order: t * 2 + k + 1, title: '', uz: `${type} sinov ${k + 1}`, type,
  status: k ? 'plan' : 'done', rating: k ? 0 : 8, progress: '', note: '', updated: 0,
})));
MULTI.push({ id: 'notitle', order: 11, title: 'Faqat asl nom', uz: '', type: 'Anime', status: 'watching', rating: 0, progress: '', note: '', updated: 0 });

async function seedMulti(page) {
  await page.addInitScript((data) => {
    if (sessionStorage.seeded) return; sessionStorage.seeded = 1;
    localStorage.setItem('mening-royxatim-v1', JSON.stringify(data));
  }, MULTI);
  await page.goto('/');
  await expect(page.locator('#types .chip')).toHaveCount(6);
}

async function expectClean(page, label) {
  expect(await overflowX(page), `${label}: gorizontal scroll`).toBeLessThanOrEqual(0);
  expect(await cutLabels(page), `${label}: kesilgan yorliqlar`).toEqual([]);
}

test('tur chiplari bir qatorda, ro‘yxat yuqorida', async ({ page }) => {
  await seedMulti(page);
  const h = await page.locator('#types').evaluate((el) => el.getBoundingClientRect().height);
  expect(h).toBeLessThanOrEqual(52);
  const tops = await page.locator('#types .chip').evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))]);
  expect(tops).toHaveLength(1);
  const box = await page.locator('#list .row').first().boundingBox();
  expect(box.y).toBeLessThanOrEqual(260);   // R6: ≥2 tur bo‘lsa 260
  await expectClean(page, 'chiplar');
  const last = page.locator('#types .chip').last();
  await last.scrollIntoViewIfNeeded(); await last.click();
  await expect(last).toHaveClass(/active/);
  await expect(page.locator('#list .row')).toHaveCount(2);
  await expectClean(page, 'oxirgi chip tanlangan');
});

test('holatlar bo‘yicha: scroll 0, kesilgan yorliq 0', async ({ page }) => {
  await fresh(page);
  await expectClean(page, 'standart');
  await page.locator('[data-view=grid]').click(); await expectClean(page, 'poster');
  await page.locator('[data-view=list]').click();
  await page.click('#menuBtn'); await expect(page.locator('#menu')).toHaveClass(/open/); await expectClean(page, 'menyu');
  await page.click('#menuBtn');
  await page.click('#statsBtn'); await expect(page.locator('#overview')).toBeVisible(); await expectClean(page, 'statistika');
  await page.click('#statsBtn');
  await page.locator('#list .row [data-status]').first().click();
  await expect(page.locator('#ask')).toHaveJSProperty('open', true); await expectClean(page, 'holat sheet’i');
  await page.locator('#ask').getByRole('button', { name: 'Bekor qilish' }).click();
  await page.click('#sortBtn');
  await expect(page.locator('#ask')).toHaveJSProperty('open', true); await expectClean(page, 'saralash sheet’i');
  await page.locator('#ask').getByRole('button', { name: 'Bekor qilish' }).click();
  await page.click('#menuBtn'); await page.click('[data-act=year]');
  await expect(page.locator('#page .share-prev img')).toBeVisible(); await expectClean(page, 'yil sahifasi');
  await page.locator('#pageClose').click(); await expect(page.locator('#page')).toHaveJSProperty('open', false);
});

test('ko‘p turli ro‘yxat holatlari: scroll 0, kesilgan yorliq 0', async ({ page }) => {
  await seedMulti(page);
  await expectClean(page, 'ko‘p tur');
  await page.locator('[data-view=grid]').click(); await expectClean(page, 'ko‘p tur, poster');
  await page.locator('[data-view=list]').click();
  await page.click('#statsBtn'); await expectClean(page, 'ko‘p tur, statistika');
});

test('holat sheet’i sarlavhasi: uz bo‘lmasa asl nom', async ({ page }) => {
  await seedMulti(page);
  await page.locator('#list .row', { hasText: 'Faqat asl nom' }).locator('[data-status]').click();
  await expect(page.locator('#ask h2')).toHaveText('Faqat asl nom');
});
