import { test, expect } from '@playwright/test';
import { fresh, smallTargets } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await fresh(page); });

async function expectNoSmall(page) { expect(await smallTargets(page)).toEqual([]); }

test('hamma nishonlar ≥44px — ro‘yxat, poster, menyu', async ({ page }) => {
  await expectNoSmall(page);
  await page.locator('[data-view=grid]').click(); await expectNoSmall(page);
  await page.click('#menuBtn'); await expectNoSmall(page);
});

test('hamma nishonlar ≥44px — oynalar', async ({ page }) => {
  await page.click('#fab'); await page.click('#more summary'); await expectNoSmall(page);
  await page.click('#closeBtn');
  await page.locator('#list .row [data-status]').first().click(); await expectNoSmall(page);
});

test('holatni sheet orqali o‘zgartirish', async ({ page }) => {
  await page.locator('#list .row [data-status]').first().click();
  await expect(page.locator('#ask button[aria-current=true]')).toHaveText('Ko‘rilgan');
  await page.locator('#ask').getByRole('button', { name: 'Rejada' }).click();
  await expect(page.locator('#list .row').first().locator('[data-status]')).toHaveText('Rejada');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
});

test('tahrirlash belgisi ko‘rinadi', async ({ page }) => {
  await expect(page.locator('#list .row .go').first()).toBeVisible();
});

test('FAB holat va bahoni to‘smaydi', async ({ page }) => {
  for (const y of [0, 1500, 99999]) {
    await page.evaluate((y) => scrollTo(0, y), y);
    const hits = await page.evaluate(() => {
      const f = document.querySelector('#fab').getBoundingClientRect();
      const hit = (r) => r.bottom > f.top && r.top < f.bottom && r.right > f.left && r.left < f.right;
      return [...document.querySelectorAll('#list .row [data-status], #list .row .rate')]
        .filter((el) => hit(el.getBoundingClientRect())).length;
    });
    expect(hits).toBe(0);
  }
});
