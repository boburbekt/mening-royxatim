import { test, expect } from '@playwright/test';
import { fresh, mockMeta, smallTargets, overflowX } from './helpers.mjs';

const media = (i) => ({ id: i, title: { romaji: `Naruto ${i}`, english: i === 2 ? null : `Naruto English ${i}` }, episodes: 12 + i, chapters: null, duration: 24, genres: ['Action'], startDate: { year: 2000 + i }, coverImage: { large: `https://s4.anilist.co/${i}.png` } });

test('anime nomi bo‘yicha taklif va tanlash', async ({ page }) => {
  await mockMeta(page, { anilist: [{ id: 1, title: { romaji: 'Ore dake Level Up na Ken', english: 'Solo Leveling' }, episodes: 12, chapters: null, duration: 24, genres: ['Action', 'Fantasy'], startDate: { year: 2024 }, coverImage: { large: 'https://s4.anilist.co/x.png' } }] });
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Solo lev');
  await expect(page.locator('#sugg .sug')).toHaveCount(1);
  await page.locator('#sugg .sug').first().click();
  await expect(page.locator('#fTitle')).toHaveValue('Solo Leveling');
  await expect(page.locator('#fTotal')).toHaveValue('12');
  await expect(page.locator('#fUz')).toHaveValue('Solo lev');
  await page.click('.sheet-foot button[type=submit]');
  expect(await page.evaluate(() => JSON.parse(localStorage['mening-royxatim-v1']).at(-1)))
    .toMatchObject({ total: 12, epMin: 24, genres: ['Action', 'Fantasy'] });
});

test('tur bo‘yicha manba', async ({ page }) => {
  await mockMeta(page, { anilist: [], tvmaze: [{ show: { id: 169, name: 'Breaking Bad', premiered: '2008-01-20', genres: ['Drama'], averageRuntime: 60, image: { medium: 'https://static.tvmaze.com/m.jpg' } } }], episodes: 62 });
  await fresh(page); await page.click('#fab');
  await page.locator('label.opt', { hasText: 'Manhva' }).click(); await page.fill('#fUz', 'Solo');
  await expect.poll(() => page.evaluate(() => window.__metaReqs.at(-1))).toMatchObject({ api: 'anilist', variables: { type: 'MANGA', country: 'KR' } });
  await page.locator('label.opt', { hasText: 'Serial' }).click();
  await expect(page.locator('#sugg .sug')).toHaveCount(1);
  await page.locator('#sugg .sug').click();
  await expect(page.locator('#fTotal')).toHaveValue('62');
});

test('tarmoq xatosi', async ({ page }) => {
  await page.route('https://graphql.anilist.co/**', (r) => r.abort());
  await page.route('https://graphql.anilist.co/', (r) => r.abort());
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Naruto');
  await page.waitForTimeout(700);
  await expect(page.locator('#sugg .sug')).toHaveCount(0);
  await expect(page.locator('#toast')).not.toHaveClass(/show/);
  await page.click('#findBtn');
  await expect(page.locator('#toast')).toContainText('Internetdan topilmadi');
});

test('qidiruv oynasi mobil qoidalarga mos', async ({ page }) => {
  await mockMeta(page, { anilist: [1, 2, 3].map(media) });
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Naruto');
  await expect(page.locator('#sugg .sug')).toHaveCount(3);
  expect(await smallTargets(page)).toEqual([]);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
});

test('qo‘lda yozilgan asl nomi va jami qismlar ustiga yozilmaydi', async ({ page }) => {
  await mockMeta(page, { anilist: [media(1)] });
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Boruto');
  await page.locator('#more summary').click();
  await page.fill('#fTitle', 'Mening nomim'); await page.fill('#fTotal', '5');
  await page.click('#findBtn');
  await expect(page.locator('#sugg .sug')).toHaveCount(1);
  await page.locator('#sugg .sug').click();
  await expect(page.locator('#fTitle')).toHaveValue('Mening nomim');
  await expect(page.locator('#fTotal')).toHaveValue('5');
  await expect(page.locator('#fUz')).toHaveValue('Boruto');
  expect(await page.evaluate(() => window.__metaReqs.at(-1))).toMatchObject({ variables: { search: 'Mening nomim' } });
});
