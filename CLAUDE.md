# Languruu — Proje Rehberi

Yabancı kelime öğrenme web uygulaması: kullanıcılar kendi kelime gruplarını oluşturur, flashcard modlarıyla çalışır, marketplace'ten hazır setleri paylaşır/kopyalar, ilerlemelerini takip eder. Canlı: **languruu.com**. Lisans: **özel mülk / proprietary** (bkz. LICENSE.md).

## Monorepo yapısı
```
languruu/
├─ backend/    # NestJS API (port 3001)
├─ frontend/   # Next.js App Router (port 3000)
├─ LICENSE.md
└─ CLAUDE.md
```

### backend/ (NestJS + Drizzle ORM + PostgreSQL)
- **Katmanlı mimari:** controller → service → repository. DTO doğrulama `class-validator`.
- Modüller (`src/`): `auth`, `users`, `words`, `marketplace`, `top-performers`, `reports`, `admin`, `mail`, `health`.
- Drizzle şemaları: `src/_common/drizzle/*.ts` (users, words, market_place, user_sessions, auth_tokens, reports, security_events, error_logs, top_performers).
- Guard: `src/_common/guards/JwtAuthGuard.ts` — her istekte JWT + `AuthStateService` ile DB'den ban/silme/token geçerliliği kontrolü.
- Global `HttpExceptionFilter` → `BaseResponse { data, message, success }`; kritik hatada mail + admin panel "Son Hatalar".
- Migrations: `backend/drizzle/` (drizzle-kit).

### frontend/ (Next.js App Router + TypeScript + Tailwind + next-intl)
- `app/(auth)`: login, register, forgot/reset-password, verify-email.
- `app/(dashboard)`: study, words, add, groups, marketplace, top-performers, profile, settings, admin, users/[username].
- `app/(legal)`: privacy, terms. `app/suspended`, `app/not-found.tsx`.
- **Pazarlama (SEO) rotaları:** `app/page.tsx` (TR ana sayfa), `app/en/page.tsx` (EN ana sayfa), `app/blog` + `app/en/blog` (rehber/blog).
- `app/lib/seo.ts`: canonical/hreflang URL'leri, JSON-LD grafiği, `SOCIAL_PROFILES`.
- `app/i18n/locales.ts`: desteklenen diller ve `x-locale` başlığı — **tek kaynak**.
- `app/lib/api-client.ts`: backend'e giden **tüm** server-side fetch'ler.
- `app/i18n/`: next-intl; `messages/tr.json` + `en.json`.
- Her route'un `actions.ts`'i: server action'lar (cookie set, backend çağrısı).
- `proxy.ts` (middleware): access token yakında biterse otomatik refresh, public/auth route yönlendirmeleri.

## Uçtan uca bir istek nasıl çalışır
**Okuma (ör. grup listesi):**
1. Kullanıcı `/groups`'a gider (server component).
2. Sayfa server-side `api-client.getWordsInfo()` çağırır.
3. api-client, cookie'deki `access_token`'ı `Authorization: Bearer` header'ına koyup backend'e istek atar (`API_BASE_URL = NEXT_PUBLIC_API_URL ?? http://localhost:3001`, yol `/api/...`).
4. Backend: `JwtAuthGuard` token'ı doğrular + `AuthStateService` DB'den durum çeker → geçerse controller → service → repository → Drizzle → DB.
5. `BaseResponse { data, message, success }` döner.
6. api-client sonucu yorumlar: **401 → `/login` redirect**, **403 + message `ACCOUNT_SUSPENDED` → `/suspended` redirect**, diğer hata → `throw` (frontend **toast** ile gösterir).

**Mutasyon (ekleme/düzenleme):** client component → route'un `actions.ts`'indeki server action → api-client → backend. Optimistic update yaygın; hata olursa geri alınıp toast atılır.

## Auth akışı
- JWT access token (kısa ömür) + **refresh token rotasyonu** (her yenilemede eski iptal). **Hırsızlık tespiti:** bir refresh iki kez kullanılırsa tüm oturum ailesi iptal.
- Cookie: `access_token` + `refresh_token` (httpOnly, sameSite strict).
- Guard her istekte DB kontrolü: **ban → 403 `ACCOUNT_SUSPENDED`**, silinmiş/`token_valid_after` eski → 401.
- **"Tüm cihazlardan çıkış"** = `token_valid_after`'ı şimdiye çeker → eski access token'lar guard'da geçersiz.
- Google ile giriş, e-posta doğrulama + şifre sıfırlama (Resend). Google kullanıcıları `email_verified: true`.

## Veri modeli (önemli özellikler)
- **`words` tablosu:** kullanıcı başına **TEK satır**; `words` kolonu **JSONB** = kelime gruplarının dizisi (`WordColumn[]`). Grup: `{ id, name, description, wordPool: [{term:[], translation:[], note?}], languages:[kaynak,hedef], isShared, shareId, sourceShareId, ... }`. `note` opsiyonel hatırlatıcı (max 200 kar.), çalışma ekranında `i` ikonuyla gösterilir. Kelime/anlam max **100 karakter**, bir grupta max **500 kelime** (`Word.request.dto.ts` → `@ArrayMaxSize`). İlk grupta `INSERT ... ON CONFLICT (user_id)`, sonraki gruplarda `UPDATE`.
- **`market_place`:** paylaşılan gruplar (share_id unique). Bir grup paylaşılınca `EventEmitter('word-column.upserted')` → marketplace kaydı **otomatik** senkron (fire-and-forget).
- **`users`:** email/user_name/google_id **unique**; `is_banned`, `token_valid_after`, `study_streak`, `last_study_date`, `completed_rounds`, `deleted_at`. **Soft-delete kimliği serbest bırakır** (email/user_name mangle) → aynı bilgiyle tekrar kayıt olunabilir.
- **İstatistikler:** günlük seri (bir grup tamamlanınca artar; gün atlanınca 0), tamamlanan tur, kelime havuzu (grup sayısı), toplam kelime. Study'de grup tamamlanınca `POST /users/study/complete` çağrılır.
- **Top performers:** 10 dk'da bir cron; sıralama = **etkin günlük seri (baskın) → tamamlanan tur → toplam kelime → havuz sayısı**. Snapshot `top_performers` tablosunda JSON.

## i18n (KURAL)
- Diller: **tr + en**. Tek kaynak: `app/i18n/locales.ts`.
- **Dil çözümleme sırası** (`app/i18n/request.ts`):
  1. `getTranslations({ locale })` ile açıkça verilen dil (next-intl'in `requestLocale`'i) — **bu olmadan açık dil sessizce yok sayılır**
  2. `x-locale` başlığı — middleware pazarlama rotalarında yazar
  3. `locale` cookie'si
  4. `x-vercel-ip-country` → TR→tr, diğer→en
- **Pazarlama sayfalarında URL dili belirler**, çerez değil: `/` → tr, `/en` → en, `/blog` → tr, `/privacy`+`/terms` → tr. Middleware ayrıca `locale` cookie'sini yazar ki uygulama sayfaları aynı dilde kalsın.
- **Dil değiştirici `<a>` olmalı, `<Link>` değil.** Client-side geçişte layout yeniden render edilmez; `NextIntlClientProvider` eski dilde kalır ve sayfa yarı Türkçe yarı İngilizce çıkar.
- **`tr.json` ve `en.json` HER ZAMAN aynı anahtarlara sahip olmalı (parity).** Yeni metin eklerken **ikisine de** ekle. Doğrulama:
  ```bash
  cd frontend && node -e "const tr=require('./app/i18n/messages/tr.json'),en=require('./app/i18n/messages/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(tr).sort(),b=f(en).sort();console.log('tr',a.length,'en',b.length,'diff',a.filter(k=>!b.includes(k)).concat(b.filter(k=>!a.includes(k))))"
  ```

## SEO (DİKKAT — hepsi bilinçli, geri alma)
- **Root layout'a `alternates` YAZMA.** Layout metadata'sı alt sayfalara miras kalır; sabit canonical koyarsan her sayfa "beni indeksleme, ana sayfayı indeksle" der ve Google hepsini eler. Canonical **sayfa bazında** verilir.
- **Middleware sadece bilinen rotaları korur** (`PROTECTED_PREFIXES`), "public olmayan her şeyi" değil. Böylece tanınmayan yollar Next.js'e düşüp **gerçek 404** döner. Eski hâlinde her yanlış URL `/login`'e yönleniyordu ve Search Console "Yönlendirmeli sayfa" doluyordu.
- Giriş yapmış kullanıcı `/` ve `/en`'den `/study`'ye yönlenir (`LANDING_PATHS`). `/blog` **bilerek hariç** — giriş yapmış kullanıcı da rehberi okuyabilmeli. Googlebot'un çerezi olmadığı için landing'i 200 görür, SEO etkilenmez.
- hreflang: `/` ↔ `/en` **karşılıklı** olmalı (+ `x-default` → `/en`), yoksa Google yok sayar.
- `robots.ts` uygulama rotalarını disallow eder; `sitemap.ts` sadece indekslenebilir sayfaları listeler (login/register **yok**, noindex'liler).
- `SOCIAL_PROFILES` boşsa `sameAs` alanı **hiç yazılmaz** — boş `sameAs` olumsuz sinyal.
- OG görseli `next/og` ile dinamik üretilir (`app/opengraph-image.tsx`, `app/en/opengraph-image.tsx`, ortak kod `app/lib/og-card.tsx`).

## Blog / rehber (MDX)
- İçerik: `frontend/content/blog/{tr,en}/<slug>.mdx` — düz markdown, React bileşeni de gömülebilir.
- Kayıt: `frontend/app/blog/posts.ts` — başlık, açıklama, tarih, statik MDX import'u. **Metadata tek kaynakta**, MDX'te frontmatter yok.
- Yeni yazı = 1 mdx dosyası + `posts.ts`'e 1 kayıt. Liste sayfası, sitemap, `BlogPosting` JSON-LD ve metadata **otomatik**.
- Stil: `frontend/mdx-components.tsx` (h1/h2/p/ul/a… Tailwind sınıfları).

## Çalıştırma (local)
```bash
cd backend && npm install && npm run start:dev   # önce bunu başlat (port 3001)
cd frontend && npm install && npm run dev         # sonra bu (port 3000)
```
- Backend'i **önce** başlat; frontend SSR ona bağlanır (yoksa `ECONNREFUSED`).
- `.env`'ler gitignore'da. **Local `.env` DEV Supabase projesini kullanır** — prod DB'ye local'den bağlanma. Prod değerleri yalnızca Render'da.

## Build / doğrulama
```bash
cd backend && npm run build     # nest build
cd frontend && npm run build
```
Değişiklikten sonra ilgili projeyi build et. i18n değişince parity kontrol et (yukarıdaki komut).

## Deploy
- **Frontend → Vercel:** Root Directory `frontend`, bölge `fra1` (Frankfurt). Production Branch, GitHub **default branch**'inden gelir → default = `production`.
- **Backend → Render:** Root Directory `backend`, Branch `production`, bölge Frankfurt. Build: `npm install --include=dev && npm run build`, Start: `npm run start:prod`.
- **DB → Supabase** (Frankfurt/eu-central-1). Prod ve dev **ayrı projeler**. Üçü de düşük gecikme için aynı bölgede.
- **Branch akışı:** `development`'a push = **Preview**; `development → production` PR (**squash merge**) → **canlı**. Büyük/riskli işler için `next` branch'i (kendi Preview'ı) — ama tercih edilen yol feature flag ile `development`'a erken merge.

## Branch / sürüm (KURAL — detay: `docs/BRANCHING.md`)
- Branch'ler: `production` (canlı) · `development` (bir sonraki küçük sürüm) · `next` (büyük değişimler) · `feature/*` · `hotfix/*`.
- `production`'a **asla direkt commit yok** — sadece PR.
- `next` **haftada bir** `development`'ı kendine çeker, yoksa conflict birikir.
- Hotfix `production`'a gittiği gün `development`'a da merge edilir (yoksa regresyon geri gelir).
- **SemVer, monorepo tek numara** (frontend + backend aynı). Commit'ler **Conventional Commits** (`feat`/`fix`/`chore`…).
- Her canlı çıkışta: `CHANGELOG.md` güncellenir, `package.json` sürümü yükseltilir, `production`'da `vX.Y.Z` tag'i atılır.
- Local `production` branch'i bayatlar; kıyaslamadan önce `git fetch` + `git branch -f production origin/production`.

## Drizzle / migration (DİKKAT — geçmişte sorun çıktı)
- drizzle-kit **session pooler (port 5432)** ister. Transaction pooler (6543) → `type "serial" does not exist`. Direct host `db.<ref>.supabase.co` local'den **çözülmez** (ENOTFOUND) — hep **pooler** kullan.
- Şema değişince: `npx drizzle-kit generate` → üretilen SQL'i oku → `npx drizzle-kit migrate`. **DB'yi elle kurcalama** (geçmişte kod↔DB "drift" yüzünden ON CONFLICT / eksik unique hataları yaşandı).

## Konvansiyonlar
- **Kodda yorum yok** (bilinçli temizlendi) — dokümantasyon bu dosyadadır. `eslint-disable` / `@ts-*` direktifleri korunur.
- Frontend hataları **toast** (sonner) ile gösterilir, inline `<p>` değil.
- Native `confirm()` yerine `useConfirm` hook'u (tema-uyumlu modal, `app/components/ui/useConfirm.tsx`).
- Karanlık mod: `<html class="dark">` + `globals.css`'te broad-stroke override'lar (cookie tabanlı toggle).
- Sistem/ortam/git komutlarını kullanıcı kendisi çalıştırır; ona komutları ver.

## Tuzaklar (hepsi bir kez yaşandı)
- **DTO'ya alan eklemeden JSONB'ye yeni alan koyma.** Backend'de `ValidationPipe({ whitelist: true }) ` var; DTO'da tanımlı olmayan alan **sessizce silinir**. `note` gibi her yeni `WordPool` alanı `WordPool.request.dto.ts`'e de eklenmeli.
- **`toLocaleLowerCase()` argümansız çağırma.** Makinenin diline göre davranır; sunucu ve tarayıcı farklı sonuç üretir. `app/lib/text-normalize.ts` yerine projede şu an doğrudan dil kodu geçiliyor — yeni karşılaştırmalarda da geç.
- **Kelime listesinde düzenleme yaparken objeyi sıfırdan kurma.** `{ ...entry, term, translation }` kullan; `{ term, translation }` yazarsan `note`/`uid` gibi alanlar silinir.
- **Kart içinde `position: fixed` modal açma.** Grup ve marketplace kartlarında `transform hover:scale-[1.02]` var; `transform` containing block yarattığı için `fixed inset-0` viewport'a değil **karta** göre konumlanır, üstüne `overflow-hidden` kırpar. Kart içinden açılan her modal `createPortal(..., document.body)` ile gönderilmeli (bkz. `app/components/game/GameStartButton.tsx`).
- **`.next` bozulursa** route'lar 404 döner (özellikle route grupları). Çözüm: `rm -rf frontend/.next` + yeniden başlat.
