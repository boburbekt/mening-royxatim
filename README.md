# Mening ro‘yxatim

Ko‘rgan anime, manga va kinolarim ro‘yxati — baho, holat, rasm (poster) bilan.

**Ochish:** https://boburbekt.github.io/mening-royxatim/

- Bitta `index.html` fayl, server yoki kutubxona kerak emas. Telefonda o‘rnatish mumkin (PWA) va internetsiz ham ochiladi.
- Ma’lumotlar brauzerning o‘zida saqlanadi (localStorage + IndexedDB) — har bir qurilma/brauzerda alohida.
- Zaxira: ⋯ → “Zaxira faylni yuklab olish”, boshqa qurilmaga ko‘chirish: ⋯ → “Zaxira fayldan yangilash / tiklash” (yangilash ikkala qurilmadagi yozuvlarni birlashtiradi, rasmlari bilan).

## Yangi imkoniyatlar

- **+1 qism** — Ko‘rilmoqda qatorida bitta bosish bilan keyingi qism; oxirgi qismda "Ko‘rildi" taklifi.
- **Internetdan topish** — nom yozganda poster va ma’lumot (AniList: anime, manga, manhva, anime filmlar; TVmaze: seriallar). Tekin, kalit kerak emas.
- **Mening yilim** — Telegram story uchun 1080×1920 rasm.
- **Tier-list** — S/A/B/C, 1080×1350 rasm.
- **Do‘st bilan solishtirish** — do‘stning zaxira fayli orqali, "+ Rejaga".
- **Boshqa qurilmada yangilash** — zaxira fayl bilan birlashtirish (rasmlar bilan) yoki almashtirish; o‘chirilganlar birlashtirishda ko‘chmaydi.

## Ikonlar

Ikonlar [Lucide](https://lucide.dev/icons) (`lucide-static`) dan olinadi va `index.html` ichiga inline SVG qilib yoziladi — ilova internetsiz ishlashda davom etadi. Yangi ikon qo‘shish: `tools/sync-icons.mjs` dagi ro‘yxatga nomini yozing, so‘ng `npm install && npm run icons`. HTML’da `<i data-icon="kalit"></i>`, JS’da `ICON.kalit` bilan ishlatiladi.
