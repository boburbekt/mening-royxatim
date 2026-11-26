// Lucide ikonlarini (lucide-static paketidan) index.html ichidagi ICON obyektiga yozadi.
// Ilova bitta fayl bo‘lib qoladi va internetsiz ishlaydi: ikonlar inline SVG sifatida joylanadi.
// Ishlatish: npm run icons   (yangi ikon kerak bo‘lsa — quyidagi ro‘yxatga qo‘shing)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// kalit (kodda ICON.kalit) → lucide nomi (https://lucide.dev/icons)
const ICONS = {
  chevron: "chevron-right",
  menu: "ellipsis",
  sort: "arrow-up-down",
  list: "list",
  grid: "layout-grid",
  plus: "plus",
  close: "x",
  image: "image-plus",
  link: "link",
  search: "search",
  loader: "loader-circle",
  trash: "trash-2",
  check: "check",
  year: "calendar-heart",
  tier: "trophy",
  copy: "copy",
  download: "download",
  share: "share-2",
  users: "users",
  upload: "upload",
  reset: "rotate-ccw",
};

const root = new URL("..", import.meta.url);
const iconDir = new URL("node_modules/lucide-static/icons/", root);
const htmlPath = fileURLToPath(new URL("index.html", root));

const svg = (name) => {
  const src = readFileSync(new URL(`${name}.svg`, iconDir), "utf8");
  const inner = src.slice(src.indexOf(">", src.indexOf("<svg")) + 1, src.lastIndexOf("</svg>"))
    .replace(/\s*\n\s*/g, "").replace(/\s*\/>/g, "/>").trim();
  return `<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
};

const body = Object.entries(ICONS).map(([k, n]) => `  ${k}: '${svg(n)}',`).join("\n");
const START = "/* ICONS:START — tools/sync-icons.mjs yozadi, qo‘lda o‘zgartirmang */";
const END = "/* ICONS:END */";
const html = readFileSync(htmlPath, "utf8");
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < a) throw new Error("index.html ichida ICONS:START / ICONS:END belgilari topilmadi");
writeFileSync(htmlPath, html.slice(0, a + START.length) + "\nconst ICON = {\n" + body + "\n};\n" + html.slice(b));
console.log(`${Object.keys(ICONS).length} ta ikon index.html ga yozildi`);
