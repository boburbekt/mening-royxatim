const blocked = new WeakSet();
export async function fresh(page) {
  // Tashqi API’lar testlarda hech qachon haqiqiy tarmoqqa chiqmaydi (mockMeta page-route’i bundan ustun)
  if (!blocked.has(page.context())) {
    blocked.add(page.context());
    await page.context().route(/^https:\/\/(graphql\.anilist\.co|api\.tvmaze\.com|s4\.anilist\.co|static\.tvmaze\.com)\//, (r) => r.abort());
  }
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('mening-royxatim');
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  });
  await page.reload();
}

export async function trapNativeDialogs(page) {
  await page.addInitScript(() => {
    window.__native = [];
    window.alert = (...a) => { window.__native.push(['alert', ...a]); };
    window.confirm = (...a) => { window.__native.push(['confirm', ...a]); return false; };
    window.prompt = (...a) => { window.__native.push(['prompt', ...a]); return null; };
  });
}

export async function smallTargets(page, min = 44) {
  return page.evaluate((min) => {
    const q = 'button, a[href], select, input:not([type=file]):not([hidden]), textarea, summary, [role=button], [role=tab], label.opt';
    const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    const out = [];
    for (const el of document.querySelectorAll(q)) {
      if (el.matches('.dup button')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.pointerEvents === 'none') continue;
      if (!el.getClientRects().length) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.width < min || r.height < min) out.push({ sel: name(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
    return out;
  }, min);
}

export async function overflowX(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
}

export async function cutLabels(page) {
  return page.evaluate(() => [...document.querySelectorAll('button, [role=tab], label.opt span, select, .lbl')]
    .filter((el) => el.getClientRects().length && el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim()));
}

export async function seedItems(page, items) {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.setItem('mening-royxatim-v1', JSON.stringify(items));
  }, items);
}

// Internetdan topish uchun soxta AniList / TVmaze. Haqiqiy tarmoqqa so‘rov ketmaydi:
// ikkala API va ularning rasm serverlari to‘liq ushlab olinadi. So‘rovlar window.__metaReqs ga yoziladi.
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };

export async function mockMeta(page, { anilist = [], tvmaze = [], episodes = 0 } = {}) {
  await page.addInitScript(() => { window.__metaReqs = []; });
  const log = (rec) => page.evaluate((r) => { (window.__metaReqs ||= []).push(r); }, rec).catch(() => {});
  const json = (route, body) => route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const pre = (route) => route.request().method() === 'OPTIONS' && route.fulfill({ status: 204, headers: CORS });
  await page.route('https://graphql.anilist.co/**', async (route) => {
    if (await pre(route)) return;
    const { variables } = JSON.parse(route.request().postData() || '{}');
    await log({ api: 'anilist', variables });
    return json(route, { data: { Page: { media: anilist } } });
  });
  await page.route('https://api.tvmaze.com/**', async (route) => {
    if (await pre(route)) return;
    const u = new URL(route.request().url());
    if (/^\/shows\/\d+\/episodes$/.test(u.pathname)) {
      await log({ api: 'tvmaze', episodes: u.pathname });
      return json(route, Array.from({ length: episodes }, (_, i) => ({ id: i + 1 })));
    }
    await log({ api: 'tvmaze', q: u.searchParams.get('q') });
    return json(route, tvmaze);
  });
  await page.route(/^https:\/\/(s4\.anilist\.co|static\.tvmaze\.com)\//, (route) =>
    route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'image/png' }, body: PNG_1X1 }));
}

// PNG IHDR: kenglik 16–19, balandlik 20–23 baytlar (big-endian)
export function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
