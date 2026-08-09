# 🦜 Languruu

**Learn foreign words for good.** Create your own word groups, practice with smart repetition, and discover ready-made sets.

🔗 **Live:** https://www.languruu.com
_(English below · Türkçe için aşağı kaydır)_

## About
Memorizing vocabulary usually happens in messy lists without repetition — and gets forgotten. Languruu turns it into a system: you build your own word groups, study them with smart repetition, and track your progress.

## Features
- 🗂️ **Your own word groups** — any language pair, multiple meanings per word
- 🔄 **Smart study modes** — source→target, target→source, or mixed
- 🔊 **Text-to-speech** with matching accent (English word → British accent, etc.)
- 🛒 **Marketplace** — discover ready-made sets, add with one click, share your own
- 📈 **Progress tracking** — daily streak, completed rounds, "most active learners" leaderboard
- 🌍 **Multi-language UI** (EN/TR, auto by country), dark mode, mobile-friendly

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, next-intl
- **Backend:** NestJS, Drizzle ORM, PostgreSQL (Supabase)
- **Auth:** JWT (refresh rotation + reuse detection), Google Sign-In, email verification & password reset (Resend)
- **Infra:** Vercel + Render + Supabase (same region for low latency)

## Structure
```
languruu/
├─ backend/    # NestJS API
└─ frontend/   # Next.js app
```

## License
Proprietary — **All Rights Reserved.** See [LICENSE.md](LICENSE.md). This code is publicly visible for viewing only; use, copying, modification, or distribution is not permitted.

---

# 🦜 Languruu (Türkçe)

**Yabancı kelimeleri kalıcı olarak öğren.** Kendi kelime gruplarını oluştur, akıllı tekrarlarla çalış, hazır setleri keşfet.

🔗 **Canlı:** https://www.languruu.com

## Hakkında
Kelime ezberlemek çoğu zaman dağınık listelerde, tekrar disiplini olmadan yapılıp unutuluyor. Languruu bunu bir sisteme dönüştürüyor: kendi kelime gruplarını oluşturur, akıllı tekrarla çalışır ve ilerlemeni görürsün.

## Özellikler
- 🗂️ **Kendi kelime grupların** — istediğin dil çiftinde, her kelimeye birden fazla anlam
- 🔄 **Akıllı çalışma modları** — kaynak→hedef, hedef→kaynak veya karışık
- 🔊 **Doğru aksanla sesli okuma** (İngilizce kelime → İngiliz aksanı)
- 🛒 **Marketplace** — hazır setleri keşfet, tek tıkla ekle, kendi setlerini paylaş
- 📈 **İlerleme takibi** — günlük seri, tamamlanan tur, "en aktif çalışanlar" sıralaması
- 🌍 **Çok dilli arayüz** (TR/EN, ülkeye göre otomatik), karanlık mod, mobil uyumlu

## Teknolojiler
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, next-intl
- **Backend:** NestJS, Drizzle ORM, PostgreSQL (Supabase)
- **Kimlik doğrulama:** JWT (refresh rotasyonu + hırsızlık tespiti), Google ile giriş, e-posta doğrulama & şifre sıfırlama (Resend)
- **Altyapı:** Vercel + Render + Supabase (düşük gecikme için aynı bölge)

## Lisans
Özel mülk — **Tüm Hakları Saklıdır.** Bkz. [LICENSE.md](LICENSE.md). Kod yalnızca görüntüleme amacıyla açıktır; kullanım, kopyalama, değiştirme veya dağıtım yasaktır.
