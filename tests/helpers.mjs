export async function fresh(page) {
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
