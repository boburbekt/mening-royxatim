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

test('manga taklifida "bob" yoziladi', async ({ page }) => {
  await mockMeta(page, { anilist: [{ id: 7, title: { romaji: 'Berserk', english: 'Berserk' }, episodes: null, chapters: 201, duration: null, genres: [], startDate: { year: 1989 }, coverImage: { large: 'https://s4.anilist.co/b.png' } }] });
  await fresh(page); await page.click('#fab');
  await page.locator('label.opt', { hasText: 'Manga' }).click(); await page.fill('#fUz', 'Berserk');
  await expect(page.locator('#sugg .sug')).toHaveCount(1);
  await expect(page.locator('#sugg .sug small')).toContainText('201 bob');
  await expect(page.locator('#sugg .sug small')).not.toContainText('qism');
});

test('#sugg yashirin bo‘lsa joy egallamaydi', async ({ page }) => {
  await fresh(page); await page.click('#fab');
  expect(await page.evaluate(() => [$('#sugg').hidden, getComputedStyle($('#sugg')).display])).toEqual([true, 'none']);
});

// Har bir poster havolasi uchun boshqa rangli rasm — qaysi rasm qo‘yilganini ajratish uchun
const colorSvg = (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"><rect width="20" height="30" fill="${c}"/></svg>`;
async function colorCovers(page) {
  await page.route(/^https:\/\/s4\.anilist\.co\//, (route) => {
    const c = { '1': '#f00', '2': '#0f0', '3': '#00f' }[route.request().url().match(/\/(\d)\.png$/)?.[1]] || '#888';
    return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'image/svg+xml' }, body: colorSvg(c) });
  });
}
const prevSrc = (page) => page.locator('#prev').getAttribute('src');

test('boshqa natija qayta tanlansa rasm, asl nomi va qismlar yangilanadi', async ({ page }) => {
  await mockMeta(page, { anilist: [1, 2, 3].map(media) }); await colorCovers(page);
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Naruto');
  await page.locator('#sugg .sug').nth(0).click();
  await expect(page.locator('#prev')).toBeVisible();
  await expect(page.locator('#fTitle')).toHaveValue('Naruto English 1');
  await expect(page.locator('#fTotal')).toHaveValue('13');
  const first = await prevSrc(page);

  await page.click('#findBtn');
  await page.locator('#sugg .sug').nth(2).click();
  await expect(page.locator('#fTitle')).toHaveValue('Naruto English 3');
  await expect(page.locator('#fTotal')).toHaveValue('15');
  await expect.poll(() => prevSrc(page)).not.toBe(first);
  await expect(page.locator('#drop')).not.toHaveClass(/loading/);
});

test('qo‘lda qo‘shilgan rasm internetdan tanlanganda almashmaydi', async ({ page }) => {
  await mockMeta(page, { anilist: [media(1)] }); await colorCovers(page);
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Naruto');
  await page.locator('#urlBtn').click();
  await page.fill('#urlIn', 'https://s4.anilist.co/9.png'); await page.click('#urlOk');
  await expect(page.locator('#prev')).toBeVisible();
  await expect.poll(() => prevSrc(page)).not.toBeNull();
  const mine = await prevSrc(page);
  await page.click('#findBtn');
  await page.locator('#sugg .sug').click();
  await expect(page.locator('#fTitle')).toHaveValue('Naruto English 1');
  expect(await prevSrc(page)).toBe(mine);
});

test('API javobi kelguncha loading ko‘rinadi', async ({ page }) => {
  await mockMeta(page, { anilist: [media(1)] });
  let release; const gate = new Promise((r) => { release = r; });
  await page.route('https://graphql.anilist.co/**', async (route) => { await gate; return route.fallback(); });
  await fresh(page); await page.click('#fab'); await page.fill('#fUz', 'Naruto');
  await expect(page.locator('#sugg .sug-load')).toBeVisible();
  await expect(page.locator('#findBtn')).toHaveAttribute('aria-busy', 'true');
  release();
  await expect(page.locator('#sugg .sug')).toHaveCount(1);
  await expect(page.locator('#sugg .sug-load')).toHaveCount(0);
  await expect(page.locator('#findBtn')).not.toHaveAttribute('aria-busy', 'true');
});
