// Renders icons/icon.svg to PNG: node tools/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../icons/', import.meta.url));
const svg = await readFile(dir + 'icon.svg', 'utf8');
const targets = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };

const browser = await chromium.launch();
for (const [name, size] of Object.entries(targets)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:#0f0e17}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await writeFile(dir + name, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: size, height: size } }));
  await page.close();
}
await browser.close();
