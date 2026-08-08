# DilÖğren (Next.js 16)

Bu proje, orijinal tek dosyalık React bileşeninin **Next.js 16 (App Router)**
yapısına dönüştürülmüş halidir.

## Yapılan değişiklikler

- `pages/` yerine **App Router** (`app/`) kullanıldı.
- Bileşen, state (`useState`) kullandığı için `app/page.tsx` başına
  `"use client"` eklendi.
- Kullanılmayan `swiper` importu kaldırıldı (orijinal kodda import edilmiş
  ama hiç kullanılmıyordu).
- Google Font (Space Grotesk) ve Font Awesome ikonları `app/globals.css`
  içine taşındı.
- TypeScript'e geçirildi (`Word`, `WordGroup`, `Performer`,
  `MarketplaceGroup` arayüzleri eklendi).
- Tailwind CSS yapılandırması (`tailwind.config.js`, `postcss.config.js`)
  eklendi.
- `next.config.js` içine `readdy.ai` görsellerine izin veren
  `images.remotePatterns` eklendi (ileride `next/image` kullanmak
  isterseniz hazır).

## Kurulum

```bash
npm install
npm run dev
```

Ardından tarayıcıda `http://localhost:3000` adresini açın.

## Proje yapısı

```
dilogren-nextjs/
├── app/
│   ├── layout.tsx      # Root layout, metadata
│   ├── page.tsx        # Ana sayfa (dönüştürülen bileşen)
│   └── globals.css     # Tailwind + font importları
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Notlar

- Paylaşım modalı (`isShareModalOpen`) orijinalde iki farklı yerden
  tetiklenip her sekmede yeniden render ediliyordu; modal, sekme
  koşulundan bağımsız tek bir yere taşındı, böylece hem "Gruplarım" hem
  de grup kartlarındaki "Paylaş" butonları aynı modalı açar.
- Form `onSubmit` için `preventDefault()` eklendi (Next.js'te sayfa
  yenilenmesini engellemek amacıyla).
