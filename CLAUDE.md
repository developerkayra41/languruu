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
- Modüller (`src/`): `auth`, `users`, `words`, `marketplace`, `friends`, `notifications`, `messages`, `top-performers`, `reports`, `admin`, `mail`, `health`.
- Drizzle şemaları: `src/_common/drizzle/*.ts` (users, words, market_place, user_sessions, auth_tokens, reports, security_events, error_logs, top_performers, friendships, notifications, conversations, messages).
- Guard: `src/_common/guards/JwtAuthGuard.ts` — her istekte JWT + `AuthStateService` ile DB'den ban/silme/token geçerliliği kontrolü.
- Global `HttpExceptionFilter` → `BaseResponse { data, message, success }`; kritik hatada mail + admin panel "Son Hatalar".
- Migrations: `backend/drizzle/` (drizzle-kit).

### frontend/ (Next.js App Router + TypeScript + Tailwind + next-intl)
- `app/(auth)`: login, register, forgot/reset-password, verify-email.
- `app/(dashboard)`: study, words, add, groups, marketplace, top-performers, profile, settings, admin, notifications, messages, users/[username].
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
- **Kayıt formunda yalnızca "İsim" istenir**, ad-soyad değil. DB alanı hâlâ `users.full_name` — değişen sadece etiket, yer tutucu ve hata metni (`auth.register.*`). Alan adını değiştirmeye kalkma: DTO, repository ve tüm profil yanıtları `full_name` üzerinden geçiyor.
- **Google ile kaydolan kullanıcı kendi kullanıcı adını seçer.** `createFromGoogle` e-postadan yine benzersiz bir kullanıcı adı üretir (hesap hiçbir zaman kullanıcı adsız kalmasın diye) ama satıra `needs_profile_setup: true` yazar. Dashboard'a ilk girişte `ProfileSetupModal` açılır: üstte Google'dan gelen fotoğraf (kalem = değiştir, çöp = kaldır), altta **boş** kullanıcı adı input'u ve Kaydet.
  - Bayrak `users.needs_profile_setup` (boolean, **`DEFAULT false`**). Varsayılanın `false` olması bilinçli: sütun eklendiğinde mevcut tüm kullanıcılar `false` alır ve modal onlara hiç çıkmaz. Yalnızca `createFromGoogle` alanı açıkça `true` yazar — şifreyle kaydolan (kullanıcı adını formda zaten seçmiş) ve Google'ı mevcut hesabına bağlayan (`linkGoogleId`) kullanıcılar etkilenmez.
  - Kullanıcı adı `POST /users/profile/complete-setup` ile kaydedilir; uç benzersizlik + küfür kontrolü yapar ve aynı UPDATE'te `needs_profile_setup`'ı `false` çeker. **Fotoğraf ise mevcut uçlardan anında kaydedilir** (`avatar/upload-url` → imzalı yükleme → `profile/update`, silme `avatar/delete`) — Kaydet düğmesi yalnızca kullanıcı adı içindir.
  - **İki onboarding modalı çakışmasın diye sıralıdır:** `DashboardShell` önce `needs_profile_setup`'a bakar, o kapandıktan (ve `router.refresh()` sonrası) ancak o zaman `DiscoverySourceModal` çıkar. İkisini birlikte render edersen üst üste binerler.
  - `AvatarCropModal` `z-50`, kurulum modalı `z-[90]` — kırpma penceresi bu yüzden `z-[100]`'lük bir sarmalayıcıya alınır, yoksa modalın **arkasında** açılırdı.

## Veri modeli (önemli özellikler)
- **`words` tablosu:** kullanıcı başına **TEK satır**; `words` kolonu **JSONB** = kelime gruplarının dizisi (`WordColumn[]`). Grup: `{ id, name, description, wordPool: [{term:[], translation:[], note?}], languages:[kaynak,hedef], isShared, shareId, sourceShareId, ... }`. `note` opsiyonel hatırlatıcı (max 200 kar.), çalışma ekranında `i` ikonuyla gösterilir. Kelime/anlam max **100 karakter**, bir grupta max **500 kelime** (`Word.request.dto.ts` → `@ArrayMaxSize`). İlk grupta `INSERT ... ON CONFLICT (user_id)`, sonraki gruplarda `UPDATE`.
- **`market_place`:** paylaşılan gruplar (share_id unique). Bir grup paylaşılınca `EventEmitter('word-column.upserted')` → marketplace kaydı **otomatik** senkron (fire-and-forget).
- **`users`:** email/user_name/google_id **unique**; `is_banned`, `token_valid_after`, `study_streak`, `last_study_date`, `completed_rounds`, `deleted_at`. **Soft-delete kimliği serbest bırakır** (email/user_name mangle) → aynı bilgiyle tekrar kayıt olunabilir.
- **İstatistikler:** günlük seri (bir grup tamamlanınca artar; gün atlanınca 0), tamamlanan tur, kelime havuzu (grup sayısı), toplam kelime. Study'de grup tamamlanınca `POST /users/study/complete` çağrılır.
- **XP / seviye:** `users.xp` (+ günlük tavan için `xp_day`, `xp_day_amount`). Matematik tek kaynakta: `backend/src/_common/utils/xp-level.ts`. Seviye L→L+1 için `100*L` XP (toplam = `50*L*(L-1)`), yani L2=100, L5=1000, L10=4500. Kazanım: doğru bilinen her kelime **+1 XP** (`POST /users/xp/award`), yarış modunda her **100 skor = +1 XP** (maç bitince `persistScores` içinde). **Grup tamamlamak XP vermez** — küçük gruplar avantaj sağlamasın diye. Günlük tavan **300 XP** (iki kaynak da aynı tavana tabi), SQL'de tek UPDATE içinde atomik uygulanır. Profil ve public profil yanıtlarına `levelInfo()` ile `xp/level/xp_into_level/xp_for_next` eklenir; rozet `app/components/ui/LevelBadge.tsx`.
- **Ekranda hep TOPLAM XP yazar, seviye içi ilerleme değil.** 189 XP'li bir kullanıcı "89" görmemeli — seviye atlayınca sayının sıfırlanması "XP kaybettim" gibi okunuyordu. Seviye içi ilerlemeyi yalnızca rozetin halkası gösterir; sonraki seviyenin eşiği tooltip'te (`nextLevelTotalXp()`, `app/lib/xp.ts` — toplam eşik = `xp + (xp_for_next - xp_into_level)`). Yarış sonucu ekranı da toplamı gösterir, bu yüzden `GameXpResult` `xp` alanını taşır.
- **Seviye atlama kutlaması:** `use-xp.ts` sunucudan dönen yeni seviyeyi `xpLevel` localStorage değeriyle kıyaslar; arttıysa toast + emoji konfeti. İlk yanıt yalnızca referansı kurar (yanlış pozitif olmasın). Yarış modunda XP sunucuda verilir: `finish()` önce `game:finished` yollar, `persistScores` bitince ayrı bir `game:xp` event'i yollar (sonuç ekranını DB gecikmesi bekletmesin diye) ve sonuç ekranında rozetli "seviye atladın / +N XP / günlük sınır" satırı çıkar.
- **XP suistimal önlemleri:** "cevabı göster" kullanılan soru XP vermez (her iki study modunda `usedReveal` bayrağı); aynı kelime **günde bir kez** XP verir (client'ta `xpAwarded` localStorage seti, anahtar = `buildItemKeys` hash'i, gruptan bağımsız); istek başına en fazla 50 kelime (`AwardXp.request.dto.ts`) ve sunucu tarafı günlük tavan son savunma hattıdır.
- **Top performers:** 10 dk'da bir cron; sıralama = **XP (baskın) → etkin günlük seri → tamamlanan tur → toplam kelime → havuz sayısı**. **`xp = 0` olan kullanıcı listeye girmez** (`computeRanking`'de `AND u.xp > 0`, ayrıca okurken de elenir — eski snapshot 10 dk boyunca sıfırları taşıyabilir). Snapshot `top_performers` tablosunda JSON; eski snapshot'larda `xp`/`level` alanı olmayabilir, frontend'de `?? ` ile karşılanır. **`avatar_url` snapshot'tan değil, her istekte `users` tablosundan tazelenir** — yoksa avatarını değiştiren kullanıcı listede 10 dk boyunca eski fotoğrafıyla kalırdı.


## Presence / online göstergesi
- Kalıcı bağlantı (WebSocket vb.) yok. `PresenceInterceptor` global `APP_INTERCEPTOR`'dır: kimliği doğrulanmış **her** istekte `users.last_seen_at`'i tazeler, ama process belleğindeki `Map` ile kullanıcı başına **en fazla 2 dk'da bir** yazar (fire-and-forget, hata yutulur).
- "Online" = `last_seen_at >= now() - interval '5 minutes'`. Tek kaynak `src/_common/utils/presence.ts` (`ONLINE_WINDOW_MINUTES`, `onlineSince()`, `onlineFlag()`); admin sayacı, admin `online` filtresi ve yeşil nokta hep bu parçayı kullanır — ayrışırlarsa kart "42 online" der, tıklayınca 60 kişi listelenir.
- **Pencere, 2 dk yazma throttle'ı + 60 sn istemci yoklamasının altına inemez** (~3 dk taban): daha kısası aktif kullanıcıları sayaçtan düşürüp geri alır, sayı titrer. 5 dk bu tabanın üstünde pay bırakır.
- Metrik "aktif çalışan"ı değil **"sekmesi açık olan"ı** ölçer: bildirim çanı ve mesaj menüsü sekme görünürken 60 sn'de bir istek atar, bu istekler de presence'ı canlı tutar.
- Stat kartları server component prop'u, panelde polling yok — rakam sayfa yenilenmeden değişmez; karttaki yeşil nabız sadece dekoratif. Tablodaki **"Aktif/Banlı" rozeti presence değil `is_banned`**.

### Yeşil nokta (avatar üzerinde)
- **Gizlilik ayarı kullanıcıya ait:** `users.presence_visibility` (`off` | `friends` | `everyone`), **varsayılan `off`** — özellik opt-in. Ayarlar sayfasındaki "Aktiflik Durumu" kartından değişir (`POST /users/settings/presence`).
- **Görünürlük kuralı tek fonksiyonda:** `canSeePresence()` (`utils/presence.ts`). Sıra: çevrimiçi değilse hayır → **admin her zaman görür** → `everyone` herkese → `friends` yalnızca arkadaşlara **ve kişinin kendisine** → `off` yalnızca admine. Kendi avatarında nokta, ayar `off` değilse çıkar; yani "başkası görebiliyor mu"yu dürüstçe yansıtır.
- **Hesaplama sunucuda biter.** Yanıtlara sadece `is_online: boolean` gider; `presence_visibility` ve `last_seen_at` dışarı sızmaz. Kimin ne gördüğü istemciye bırakılırsa gizlilik ayarı anlamsızlaşır.
- **Çevrimiçilik SQL'de hesaplanır** (`onlineFlag()` / `onlineSince()`), JS'te `new Date()` ile karşılaştırılmaz — ham SQL timestamp'leri metin döner ve yerel saat sanılır (bkz. [Zaman / timezone](#zaman--timezone-tuzak)).
- `PresenceService` (`src/_common/presence/`) iki ucu sunar: tek kişi için `canSee()`, liste için `visibleIds()` (üç sorgu: presence satırları + görüntüleyenin admin durumu + arkadaş id'leri). `PresenceModule` yalnızca `DrizzleModule`'e bağlıdır, repository'leri kendi sağlar — döngü yok. Hazır bir `PresenceViewer` ikinci kez sorgulanmasın diye `visibleIds`'e geçirilebilir (genel sohbet `is_moderator` için zaten hesaplıyor).
- **Görüntüleyenin kendi satırı her zaman online sayılır** (`visibleIds`/`canSee` içinde): isteği o an kendisi attığı için doğrudur ve 2 dk'lık yazma throttle'ı yüzünden kendi noktasının sönük görünmesini engeller.
- Nokta `app/components/ui/PresenceDot.tsx`; `Avatar`'a `online` prop'u geçilince avatar `relative` bir sarmalayıcıya alınır (prop yoksa eski ağaç birebir korunur, mevcut çağrı yerleri etkilenmez). Boyutlar avatar boyutundan türer, büyük avatarlarda 20px'e sabitlenir. Public profil sayfası `Avatar` değil ham `<Image>` kullandığı için `PresenceDot`'u kendi `relative` kabına elle koyar.
- Nokta çıkan yerler: public profil, kendi profili, genel sohbet baloncukları, en başarılılar, arkadaş listesi + gelen istekler, mesaj listesi ve yazışma başlığı. Genel sohbette **kendi mesajlarında avatar yok**, o yüzden `send`/`edit` yanıtlarına `is_online` konmaz.
- **`POST /users/public-profile` artık `JwtAuthGuard` istiyor** — görüntüleyeni bilmeden görünürlük kuralı uygulanamaz. Sayfa zaten `/users` altında ve middleware ile giriş şartlıydı.

## Arkadaşlık & bildirimler
- **`friendships`:** tek satır bir ilişkiyi temsil eder — `requester_id`, `addressee_id`, `status` (`pending` | `accepted`). `(requester_id, addressee_id)` unique. **Ret = satırı sil** (böylece tekrar istek atılabilir), arkadaşlıktan çıkarmak da satırı siler. `findRelation` **iki yönü birden** sorgular; A→B beklerken B→A istek atarsa servis bunu otomatik kabule çevirir.
- **`notifications`:** `user_id` (alıcı), `actor_user_id` (eylemi yapan), `type`, `payload` (JSONB), `read_at`. Tipler: `friend_request` (payload'da `request_id`), `friend_accepted`, `group_copied` (payload'da `group_name` + `share_id`).
- **Bildirim üretimi doğrudan servis çağrısıdır**, event değil: `FriendsModule` ve `MarketplaceModule`, `NotificationsModule`'ü import eder. `NotificationsModule` yalnızca `DrizzleModule`'e bağlıdır — döngü yok. `NotificationsService.create` alıcı = aktör ise sessizce hiçbir şey yazmaz.
- **Kütüphane kopyası bildirimi** `copyToUser` içinde, `if (!existingCopy)` bloğunda üretilir (indirme sayacıyla aynı yerde) — aynı grubu tekrar kopyalamak yeni bildirim doğurmaz.
- İstek kabul/ret edilince ilgili `friend_request` bildirimi **silinir** (`payload->>'request_id'` ile bulunur), aksi halde panelde ölü Kabul/Reddet butonları kalır.
- **Soft-delete edilmiş kullanıcılar** arkadaş listesi, istek listesi, sayaçlar ve bildirim aktörü sorgularında `deleted_at IS NULL` ile elenir; ilişkiler DB'de kalır (FK'ler `ON DELETE` davranışı tanımlamaz, proje zaten hard-delete yapmaz).
- **Sayaçlar profil yanıtına gömülüdür:** `getProfile` → `friend_count`, `pending_request_count`, `unread_notifications`. Dashboard layout zaten `getProfile` çağırdığı için navbar çanı ekstra istek atmaz; çan yalnızca 60 sn'de bir okunmamış sayısını yoklar (panel kapalıyken, sekme görünürken).
- **Panel açılınca hepsi okundu işaretlenir** ama satırlardaki okunmamış vurgusu o an için korunur (liste açılmadan önceki `read_at` ile render edilir).
- Frontend: `app/components/social/` (FriendButton, NotificationBell, NotificationRow, actions) + `app/(dashboard)/notifications` (üç sekme: bildirimler, istekler, arkadaşlar; `?tab=` ile derin bağlantı).
- Göreli zaman `app/lib/relative-time.ts`. Postgres `timestamp` (timezone'suz) sunucu saatine göre yorumlandığı için negatif fark **0'a kırpılır** — yerelde "3 saat sonra" gibi çıktı olmaz.


## Mesajlaşma (DM)
- **Sadece arkadaşlar yazışır.** `MessagesService.resolveFriend` her işlemde `FriendRepository.areFriends` kontrolü yapar; değilse **403 + mesaj `NOT_FRIENDS`** döner (`ACCOUNT_SUSPENDED` gibi koda göre ayrışan özel bir mesaj). Arkadaşlıktan çıkılırsa yazışma listeden ve okumadan da düşer — `listConversations`/`countUnreadSenders` sorguları `friendships` ile JOIN'lidir.
- **İki tablo:** `conversations` (çift `user_a_id` < `user_b_id` olacak şekilde **normalize** edilir, `(user_a_id, user_b_id)` unique) + `messages` (`conversation_id`, `sender_id`, `body`, `created_at`).
- **"Görüldü" yok.** Okunmuşluk yalnızca **alıcının kendi rozeti** için tutulur: `conversations.a_last_read_at` / `b_last_read_at`. Gönderen bu alanı hiçbir yanıtta görmez. Rozet sayısı = "kaç kişi yazdı" (okunmamış mesajı olan **konuşma** sayısı), mesaj sayısı değil.
- **Silme ve düzenleme yalnızca göndericiye aittir** (`MessagesService.ownMessage` → `sender_id !== userId` ise 403). Silme **iki taraflıdır**: satır hard-delete edilir, karşı taraftan da kaybolur. Düzenleme `messages.edited_at` damgası basar; baloncuğun en altında `(düzenlendi)` yazar. Karşı tarafın mesajına hiçbir işlem butonu render edilmez. İşlemler kendi baloncuğunun sağ üstündeki **üç nokta** menüsünde (düzenle/sil ikonları); menü **son mesajda yukarı**, diğerlerinde aşağı açılır — yazışma alanı `overflow-y-auto` olduğu için aşağı açılan menü son mesajda kırpılırdı.
- **7 gün sonra otomatik silme:** `MessageCleanupTasks` saatlik cron, `MESSAGE_TTL_DAYS` (7) sabitine göre `DELETE ... WHERE created_at < now() - interval`.
- **Zaman damgaları hep Postgres `now()`'dan gelir** (`markRead`, `deleteOlderThan` raw SQL). Karşılaştırmalarda JS `new Date()` yazma; iki kaynağı karıştırınca yerelde okunmamışlar "okundu" görünür. Genel timezone kuralı için bkz. [Zaman / timezone](#zaman--timezone-tuzak).
- Bildirim tipi `message_received`: aynı kişiden gelen **okunmamış** bildirim varsa yenisi eklenmez, mevcudun `created_at`'i tazelenir (`upsertMessageNotification`) — yoksa her mesaj bir bildirim üretirdi. Yazışma açılınca o kişinin bildirimi okundu işaretlenir.
- Sayaç profil yanıtında: `getProfile` → `unread_messages`. **Ama layout client-side gezinmede yeniden çalışmaz**, o yüzden menüdeki satır `MessagesMenuItem` client bileşenidir: sunucu değerini başlangıç alır, 60 sn'de bir (sekme görünürken) ve **profil menüsü her açıldığında** `/messages/unread`'i yoklar. Sunucu değerine güvenip statik render edersen mesaj gelince rozet çıkmaz.
- **Mesajlar bölümü geçmişte tek kayıt tutar:** listeden yazışmaya geçiş ve yazışmadan listeye dönüş `<Link replace>` ile yapılır. Böylece `/messages` üzerindeki geri tuşu (`router.back()`) bölüme girmeden önceki sayfaya (gruplarım, profil, nereden gelindiyse) döner. Push kullanılırsa liste↔yazışma arasında sonsuz geri döngüsü oluşur.
- Frontend: `app/(dashboard)/messages` (liste) + `messages/[username]` (yazışma; 15 sn'de bir sekme görünürken yoklar), `app/components/social/MessageButton.tsx` (profildeki zarf — arkadaş değilse toast ile uyarır).
- İç kaydırma alanlarında `.pretty-scroll` sınıfı var (`globals.css`): ince, mor→mavi degrade, yuvarlak uçlu; Firefox `scrollbar-width/color`, WebKit `::-webkit-scrollbar-*` ile karşılanır ve karanlık modda ayrıca tanımlıdır.

- **Study cevap eşleştirme:** `frontend/app/lib/answer-match.ts` tek kaynak. `normalizeAnswer` cevabın dil koduyla küçük harfe indirir, kıvrık kesme işaretlerini `'` yapar, **çoklu boşlukları teke indirir** ve dil `en` ise İngilizce kısaltmaları açar (`i'm` / `i'am` / `im` → `i am`, `dont` → `do not`, `cannot` / `cant` → `can not`). Hem kabul edilen cevaplar hem kullanıcının yazdığı aynı fonksiyondan geçer, bu yüzden dönüşüm asla yanlış-negatif üretmez. Belirsiz kesmesiz biçimler (`its`, `were`, `well`, `ill`, `id`, `lets`) **bilerek** haritada yok — gerçek kelimelerle çakışıyor. Yarış modu ayrı bir yargıç kullanır: `backend/src/game/judge/`.

## Şarkı sözü grupları
- **Grup oluştururken açılan bir anahtar:** `/groups` modalındaki "Şarkı sözü grubu" switch'i `WordColumn.isSong` alanını `true` yapar. Bayrak **oluşturma anında** belirlenir; repository'nin güncelleme dalı alanı `...existingColumn` ile korur ama istekten gelen yeni değeri uygulamaz — normal bir grup sonradan şarkıya (ya da tersi) çevrilemez.
- **Ayrı bir tablo yok.** Her mısra sıradan bir `WordPool` girdisidir: `term: [mısra]`, `translation: [anlamı]`, opsiyonel `note`. Böylece study, XP, ilerleme kaydı, marketplace ve kelime listesi hiçbir değişiklik olmadan çalışır. `isSong` **DTO'ya da eklendi** (`Word.request.dto.ts`) — yoksa `whitelist: true` alanı sessizce silerdi (bkz. [Tuzaklar](#tuzaklar-hepsi-bir-kez-yaşandı)).
- **Sıra veridedir**, ayrı bir index alanı yok: `wordPool` dizisinin kendi sırası mısra sırasıdır. Bu yüzden şarkı grupları `AddClient`'ı **kullanmaz** — o ekran yeni kelimeyi havuzun **başına** ekler ve `mergeNewEntryIntoPool` ile çakışanları birleştirir; ikisi de şarkıda yıkıcıdır (nakarat satırları tek satıra katlanırdı). Şarkı grupları `SongAddClient` ile tüm havuzu **baştan yazar** (`saveSongLines`).
- `add/page.tsx` gruba bakıp dallanır: `isSong` ise `SongAddClient`, değilse `AddClient`.
- **Editör tek bir tablodur:** iki kolon (mısra / anlamı), satır başına not düğmesi ve silme düğmesi, altta "Mısra Ekle", en altta "Kaydet". Enter ilk hücreden ikinciye, ikinci hücreden **yeni satıra** geçirir. Kaydederken iki hücresi de boş olan satırlar sessizce atılır, yalnız biri doluysa hata verilir. Sınırlar: 300 mısra, mısra başına 200 karakter.
- **Kaydedilmemiş değişiklik koruması** `app/lib/use-unsaved-guard.ts`: (1) `beforeunload` sekme kapatma/yenileme için, (2) **capture fazında** doküman geneli tıklama dinleyicisi iç bağlantılar için — `<Link>` de sonuçta `<a>` olduğu için tüm dashboard gezinmesi yakalanır, (3) `history.pushState` ile sahte geçmiş girdisi + `popstate` mobil geri tuşu için (genel sohbetteki desen). Üç seçenekli modal çıkar: kaydet ve çık / kaydetmeden çık / vazgeç. Bağlantıyla çıkarken sahte girdi tepedeyse `router.replace` kullanılır, `push` değil — yoksa geçmişte /add'den iki girdi kalırdı.
- **Sahte geçmiş girdisi kullanan bileşenler birbirinin bayrağını miras alır.** Genel sohbet ve avatar modalı `pushState({ ...window.history.state, kendiBayragi: true })` yazar; üstteki girdi bu yüzden **alttaki katmanın bayrağını da taşır**. Sonuç: sohbet açılıp kapanınca kendi `history.back()`'i guard'ın `popstate`'ini tetikliyor ve "kaydedilmemiş mısralar" modalı boş yere çıkıyordu. Guard bu yüzden iki ayrı kontrol kullanır: `popstate`'te **kendi bayrağı hâlâ duruyorsa** olay başkasınındır, yok sayılır; kendi girdisini geri almadan önce ise `unsavedGuard` **benzersiz id'si + state'in anahtar imzası** ile tepedeki girdinin gerçekten kendisininki olduğunu doğrular (yoksa temizlik sohbetin girdisini yutup paneli kapatırdı). Yeni bir katman eklerken aynı iki kontrolü uygula.
- **`WordPoolDTO`'daki `term`/`translation` sınırı 100 değil 200 karakter** — bir mısra 100 karakteri rahat aşar. Normal kelime ekranı kendi input'unda 100'de tutmaya devam eder.
- **Study'de sıralı sorulur:** `ClassicMode` `isSong` ise kuyruğu `shuffle` etmez, `0..n` sırasında kurar; tur bitince de aynı sırayla yeniden başlar. Kaydedilmiş ilerleme geri yüklenirken şarkıda **yalnızca `pointer`** alınır (kuyruk her zaman sıralı yeniden kurulur), yoksa araya eklenen mısra sırayı bozardı. Ekranda "3 / 12. mısra" göstergesi ve uzun metinlerde küçülen yazı tipi var.
- Nakarat gibi **birebir tekrar eden mısralar korunur**: `buildItemKeys` aynı içerikli girdilere `#1`, `#2` eki verdiği için ilerleme kaydı ve XP tekilleştirmesi onları ayrı sorular sayar.
- Marketplace kopyalama/paylaşım yollarında (`copyToUser`, `unshareOwnEntry`, `getPoolDetail`) `isSong` elle taşınır — bu fonksiyonlar alanları tek tek yazdığı için spread ile gelmez.

## Genel sohbet (global chat)
- **Herkese açık tek oda.** DM'den ayrı bir modül: `backend/src/global-chat/` + `global_messages` tablosu (`id, user_id, body, edited_at, created_at`). Arkadaşlık şartı yok, alıcı yok; giriş yapmış her kullanıcı okur ve yazar.
- Uçlar `POST /global-chat/{list,send,edit,delete}`. `list` son **100** mesajı eskiden yeniye döner; **düzenleme yalnızca sahibine, silme sahibine veya admine aittir** (`user_id !== userId` ve admin değilse 403). Silme hard-delete, düzenleme `edited_at` damgası basar.
- **7 gün sonra otomatik silme:** `GlobalChatCleanupTasks` saatlik cron, `GLOBAL_MESSAGE_TTL_DAYS` (7).
- Listede yazar bilgisi `users` JOIN'iyle gelir ve **soft-delete edilmiş kullanıcıların mesajları elenir** (`deleted_at IS NULL`). Timestamp'ler ham SQL'den döndüğü için `utc()` ile sarılıdır — bkz. [Zaman / timezone](#zaman--timezone-tuzak).
- Spam freni: `send`/`edit` için `@Throttle` 20/dk, gövde 1-1000 karakter.
- Frontend `app/components/social/GlobalChat.tsx`: sağ altta yüzen buton, tıklayınca **sağdan kayan panel** — tam yükseklik, `sm` üstünde ekranın **%25'i** (`sm:w-1/4 sm:min-w-[340px]`), mobilde tam genişlik + karartma. `DashboardShell`'de profil varsa render edilir, yani tüm dashboard rotalarında açılabilir. Panel **açıkken** 10 sn'de bir (sekme görünürken) yoklanır; kapalıyken hiç istek atmaz.
- **Panel yüksekliği `h-dvh`** — `h-screen` (100vh) mobil tarayıcıda adres çubuğu görünürken görünen alandan uzundur; mesaj yazma alanı ekranın altında kalıp kaydırma gerektiriyordu.
- **Mobil geri tuşu paneli kapatır:** panel açılınca `history.pushState` ile sahte bir geçmiş girdisi eklenir, `popstate` paneli (ve şikayet modalını / menüyü / düzenlemeyi) kapatır. Panel başka yolla kapanırsa (X, karartma, Escape) efektin temizliği `history.state.globalChat` bayrağına bakıp girdiyi `history.back()` ile geri alır — yoksa kapattıktan sonraki ilk geri tuşu boşa giderdi. `pushState` mevcut state'i yayar (`{ ...window.history.state }`); Next router'ın kendi alanları (`__NA`) korunmazsa popstate sayfayı yeniden yüklerdi.
- **Panel dışına tıklamak kapatır** (mousedown/touchstart; hedef `[data-global-chat-panel]` içinde değilse). O tıklama **yutulur**: capture fazında tek seferlik bir `click` dinleyicisi `preventDefault`+`stopPropagation` yapar. İki sebep: arkadaki bağlantı yanlışlıkla tetiklenmesin, ve kapanışın `history.back()`'i ile `router.push` yarışmasın (ikisi aynı anda olursa kullanıcı yanlış geçmiş girdisine düşer). Şikayet modalı veya silme onayı açıkken dış tıklama yok sayılır — ikisi de portal ile `body`'ye gittiği için panelin dışında sayılırlardı (`reportId` state'i + `confirmOpenRef`).
- **Sohbetteki profil bağlantıları paneli kapatır ve sahte geçmiş girdisini tüketir:** `goToProfile` varsayılanı iptal edip `router.replace` ile gider (üstteki girdi zaten sahte olan, onu hedefle değiştirir) ve `skipHistoryRef` ile temizliğin `history.back()`'ini atlar. `push` kullanılsa geçmişte aynı URL'den iki girdi kalır, `back()` ile birlikte kullanılsa yarış oluşur. Ctrl/Cmd/Shift/orta tık ise dokunulmaz — yeni sekmede açılsın diye.
- Panel kapanınca bileşen **unmount olmaz** (sadece `translate-x-full`), yani yazılmakta olan mesaj ve düzenleme taslağı korunur; dışarı tıklayıp kapatmak veri kaybettirmez.
- **Admin moderasyonu:** `ADMIN_EMAILS` içindeki kullanıcı **herkesin** mesajını silebilir (düzenleyemez — başkasının sözünü değiştirmek yanlış olur). İki yerden: sohbet panelindeki üç nokta menüsü (`list` yanıtındaki `is_moderator` bayrağı menüyü başkalarının baloncuklarında da açar) ve **admin panelindeki şikayet kartı** (`POST /admin/global-messages/:id/delete` → aynı `GlobalChatService.deleteMessage`; frontend silme sonrası şikayeti `reviewed` yapar). Admin kontrolü tek kaynakta: `src/_common/utils/admin-emails.ts` (`AdminGuard` ve `UsersService.getProfile` de aynı yardımcıyı kullanır).
- **Mesaj bildirme:** her baloncukta üç nokta var; başkasının mesajında **bayrak** (bildir), kendi mesajında kalem+çöp, adminde başkasının mesajında bayrak+çöp. Bildirme mevcut `reports` altyapısını kullanır: `target_type = 'global_message'`, `target_ref` = mesaj id'si (metin). Admin panelinde satır, `reports` sorgusundaki `LEFT JOIN global_messages` sayesinde **mesajın kendisini ve yazarını** gösterir; mesaj silinmiş/süresi dolmuşsa "artık yok" yazar.
- **Şikayet modalı `ReportDialog`'a ayrıldı** (`app/components/report/`), `ReportButton` artık onu sarmalıyor. Sohbette modal menünün *içinde* render edilemez: dışarı tıklama menüyü kapatınca modal da ağaçtan düşerdi. Bu yüzden `reportId` state'i panel seviyesinde tutulur, modal menüden bağımsız render edilir. Modal `createPortal` ile `body`'ye gider — panelin `transform`'u yüzünden zorunlu (bkz. [Tuzaklar](#tuzaklar-hepsi-bir-kez-yaşandı)).
- **Küfür filtresi:** `src/_common/moderation/profanity.ts` → `containsProfanityInText`, `send` ve `edit`'te çalışır, yakalarsa **400 + mesaj `PROFANITY`** (frontend bunu yerelleştirilmiş toast'a çevirir). Aynı dosyadaki eski `containsProfanity` **kullanıcı adı / grup adı / kelime** içindir ve boşlukları silip `includes` yaptığı için serbest metinde kullanılamaz ("inşallah" → "allah" gibi yanlış pozitifler üretir).
- Metin filtresi Türkçe için **ı/i ayrımını korur** — `sıkıntı`, `sıkışık`, `götürmek`, `şikayet` gibi meşru kelimeler eleniyordu, `ı`'yı `i`'ye katlamayınca sorun kendiliğinden çözülür. Gövde listesi ek almış hâlleri yakalar (`sik*` → `siktir`, `sikiyorum`), `göt`/`ass`/`cock` gibi çakışan kısa kelimeler yalnızca **tam eşleşme** ile, `amk`/`aq` ise ayrıca **tek harflik dizileri birleştirerek** (`a.q`, `s i k t i r`) yakalanır.

## Avatar depolama & temizlik (cron)
- Dosya yolu **sabit**: Supabase `avatars` bucket'ında `<userId>/avatar.<ext>` (`createAvatarUploadUrl`, `upsert: true`). Aynı isim üzerine yazıldığı için **URL değişmezse eski görsel önbellekten gelir** — tarayıcı, Supabase CDN ve özellikle Next.js image optimizer (`/_next/image?url=...` anahtarı URL'in kendisidir).
- Bu yüzden sürüm damgası **DB'ye yazılır**: `updateProfile` gelen avatar URL'ini `?v=<timestamp>` ile damgalar (`_common/utils/avatar-url.ts` → `stampAvatarVersion`). Böylece avatarı okuyan **her** uç (top-performers, genel sohbet, mesajlar, arkadaşlar, bildirimler, public profil) yeni URL'i kendiliğinden görür. Damgayı yalnızca `getProfile` okumasında eklemek yetmiyordu: ham SQL ile avatar döndüren sorgular `updated_at` seçmiyor, damgasız URL bir kez optimize edilince eski görsel takılı kalıyordu — yükleme sonrası navbar doğru, profildeki büyük avatar ve en başarılılar eski görünüyordu.
- `getProfile` eski (damgasız) satırlar için `withAvatarVersion` ile `?v=updated_at` ekler; idempotenttir, damgalı URL'e dokunmaz. **Google avatarları (harici URL) damgalanmaz** — dosya adı zaten değişiyor.
- Yükleme bitince istemci **sunucunun döndürdüğü** `avatar_url`'i state'e yazar (`ProfileClient`), imzalı yükleme yanıtındaki damgasız `publicUrl`'i değil. Karşılaştırma ve silme yollarında `?`'ten önceki kısım alınır (`stripAvatarVersion`).
- **Profil fotoğrafına tıklayınca büyük hâli modalda açılır** (`app/components/ui/AvatarLightbox.tsx`) — hem kendi profilinde hem public profilde; çocuk olarak verilen avatarı tıklanabilir bir düğmeye sarar, `src` yoksa hiç sarmalamaz. Modal `createPortal` ile `body`'ye gider (kartlardaki `transform` yüzünden zorunlu, bkz. [Tuzaklar](#tuzaklar-hepsi-bir-kez-yaşandı)) ve görsel **`unoptimized`** verilir: Next image optimizer küçük avatarı yeniden sıkıştırıp bulanıklaştırmasın diye. Kapanış yolları: X, karartmaya tıklama, Escape ve **mobil geri tuşu** (`history.pushState` + `popstate`, genel sohbetteki desenin sadeleştirilmiş hâli). Açıkken `body` kaydırması kilitlenir.
- Google avatarları modalda `=s96-c` yerine `=s512-c` ile istenir (`app/lib/avatar.ts` → `hiResAvatarUrl`); Google'ın döndürdüğü URL 96px'tir ve büyütülünce okunmaz.
- Kırpma çıktısı **1024×1024 JPEG (q0.9)** (`AvatarCropModal`) — modalda büyütülünce bulanmasın diye. Daha önce yüklenmiş avatarlar 512'de kalır, yeniden yüklenene kadar.
- **Gece 3'te `AvatarCleanupTasks` sahipsiz dosyaları siler** (`UsersService.purgeOrphanAvatars`). Sahipsiz sayılan: users tablosunda **satırı olmayan** id (elle/hard-delete), `deleted_at` dolu (soft-delete), **`is_banned` true** (bilinçli karar — ban kalkarsa kullanıcı fotoğrafını yeniden yükler), ve satırı duran kullanıcının `avatar_url`'i o dosyayı göstermiyorsa (ör. `avatar.jpg` → `avatar.png` uzantı değişiminden kalan eski dosya).
- Dosyası silinen **ama satırı duran** kullanıcıların (banlı olanlar) `avatar_url`'i `null`'a çekilir — yoksa profilde kırık resim kalırdı. Uzantı artığı silinirken geçerli dosyası duran kullanıcının alanına dokunulmaz: temizlik yalnızca `avatar_url`'in işaret ettiği dosya silindiyse yapılır.
- **1 saatlik dokunulmazlık payı var** (`AVATAR_GRACE_MS`): imzalı yükleme ile `avatar_url`'in DB'ye yazılması arasındaki kısa pencerede yeni yüklenen dosya silinmesin diye, storage'daki `updated_at` bir saatten yeniyse dosya atlanır.
- Kök dizinde **yalnızca sayısal klasörler** taranır; bilinmeyen adlar hiç ellenmez. Listeleme 1000'lik sayfalarla, silme 100'lük gruplarla yapılır. Önce tüm liste toplanır, sonra silinir — offset'ler kaymasın diye.

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
- **Middleware Server Action POST'unu ASLA yönlendirmez** (`isServerAction` → `redirectOr`). Tarayıcı 307'yi takip ederken POST'u hedefe aynen tekrarlar, dönen sayfa HTML'ini RSC istemcisi çözemez ve **"An unexpected response was received from the server"** hatası atar. Hata, aksiyonu tetikleyen bileşende değil **hedef sayfanın ağacında** (ör. `LoginForm`) göründüğü için izi sürmesi zordur. Doğru yol: aksiyon çalışsın, oturum geçersizse `api-client` 401'de kendi `redirect("/login")`'ini yapsın — istemci o yönlendirmeyi doğru işler. Token tazeleme dalı zaten `NextResponse.next()` döndüğü için etkilenmez.
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
- **Branch akışı:** `development`'a push = **Preview**; `development → production` PR (**merge commit**) → **canlı**. Büyük/riskli işler için `next` branch'i (kendi Preview'ı) — ama tercih edilen yol feature flag ile `development`'a erken merge.

## Branch (KURAL — detay: `docs/BRANCHING.md`)
- Branch'ler: `production` (canlı) · `development` (günlük iş) · `next` (büyük değişimler) · `hotfix/*`.
- `production`'a **asla direkt commit yok** — sadece PR.
- **PR'lar YALNIZCA merge commit ile kapatılır. Squash ve rebase yasak.** Squash/rebase `production`'da yeni SHA üretir, `development` o commit'i tanımaz ve bir sonraki PR'da git **dokunulmamış dosyalarda** conflict çıkarır. Merge commit ortak geçmişi koruduğu için bu sorun hiç doğmaz — "geri akış" adımına da gerek kalmaz. GitHub'da squash/rebase seçenekleri repo ayarından kapalı tutulur.
- **Sürüm numarası, CHANGELOG ve tag yok** (bilinçli olarak kaldırıldı). Canlıdaki kod = `production`'ın son commit'i; kayıt için git geçmişi yeterli. `package.json`'daki `version` alanı ölü, npm istediği için duruyor — yükseltilmez. Commit mesajlarında Conventional Commits alışkanlığı sürer ama artık bir sürüm numarası üretmediği için zorunlu değil.
- `next` **haftada bir** `development`'ı kendine çeker, yoksa conflict birikir.
- Hotfix `production`'a gittiği gün `development`'a da merge edilir (yoksa regresyon geri gelir).
- Şema değiştiyse migration **canlıya çıkmadan** prod DB'ye uygulanır (Supabase SQL Editor'den elle); `start:prod` migration çalıştırmaz.
- Local `production` branch'i bayatlar; kıyaslamadan önce `git fetch` + `git branch -f production origin/production`.

## Drizzle / migration (DİKKAT — geçmişte sorun çıktı)
- drizzle-kit **session pooler (port 5432)** ister. Transaction pooler (6543) → `type "serial" does not exist`. Direct host `db.<ref>.supabase.co` local'den **çözülmez** (ENOTFOUND) — hep **pooler** kullan.
- Şema değişince: `npx drizzle-kit generate` → üretilen SQL'i oku → `npx drizzle-kit migrate`. **DB'yi elle kurcalama** (geçmişte kod↔DB "drift" yüzünden ON CONFLICT / eksik unique hataları yaşandı).
- **Dev ve prod farklı yollardan gider.** Dev: yukarıdaki `drizzle-kit migrate` (local `.env` dev projesine bakar). Prod: local'den bağlanılmadığı için `drizzle/` altındaki üretilmiş SQL **Supabase SQL Editor'e yapıştırılıp** çalıştırılır.
- **Prod'a ASLA `drizzle-kit migrate` çalıştırma.** Elle uygulanan migration'lar drizzle'ın `drizzle.__drizzle_migrations` defterine yazılmaz; prod'da o defter boştur. `migrate` komutu bunu görüp **tüm migration'ları baştan oynatmaya kalkar** ve `relation already exists` ile patlar.
- Elle uygularken **`generate`'in ürettiği SQL'i olduğu gibi** çalıştır, elle yeniden yazma. Kod↔DB drift'i tam olarak buradan doğuyor: şema dosyası bir şey, DB başka bir şey söylüyor.

## Konvansiyonlar
- **Kodda yorum yok** (bilinçli temizlendi) — dokümantasyon bu dosyadadır. `eslint-disable` / `@ts-*` direktifleri korunur.
- Frontend hataları **toast** (sonner) ile gösterilir, inline `<p>` değil.
- `<Toaster richColors closeButton>` — **her toast'ta çarpı** var (sol üst köşede, sonner'ın kendi konumu). Toaster **`NextIntlClientProvider` içinde** durmalı: `toast.custom` ile basılan özel toast'lar `useTranslations` çağırıyor, dışarıda kalırsa context hatası verir.
- **Geri alınabilir silme:** `app/components/ui/UndoToast.tsx` → `showUndoToast({ message, onCommit, onUndo })`. Öğe listeden **hemen** kalkar, sunucuya **hiçbir şey gitmez**; 5 sn sonra `onCommit` gerçek silmeyi yapar, o süre içinde geri al ikonuna basılırsa `onUndo` öğeyi geri koyar ve istek hiç atılmaz. Geri sayım toast'ın içinde, geri al ikonu en sağda. Kullanan yerler: kelime silme (`WordsClient`) ve grup silme (`GroupsClient`).
- Sayaç `setTimeout` ile **toast'ın dışında** tutulur: sonner süreyi hover'da ve sekme gizliyken durdurur, silmenin buna bağlanması gerekirse iş belirsiz zamana kayar. `onCommit` içinde `toast.dismiss` çağrıldığı için duraklamış toast da kapanır — kullanıcı silme olduktan sonra "geri al"a basıp hiçbir şey olmadığını görmez.
- Bekleyen silme sırasında **başka bir yazma olursa** (ör. aynı grupta başka kelime düzenlenirse) silme sunucuya erken gider; `WordsClient` bunu `wroteWhilePendingRef` ile izler ve geri alma o durumda kurtarılmış havuzu ayrıca yazar. Bayrak olmadan geri alınan kelime ekranda görünür ama DB'de silinmiş kalırdı.
- Kelime geri alınırken **eski index'ine** eklenir (araya başka değişiklik girdiyse `Math.min` ile kırpılır), grup ise `pendingDeleteIds` listesinden düşürülür — grup listesi prop'tan geldiği için silme onaylanınca `router.refresh()` senkronu sağlar.
- Native `confirm()` yerine `useConfirm` hook'u (tema-uyumlu modal, `app/components/ui/useConfirm.tsx`).
- Karanlık mod: `<html class="dark">` + `globals.css`'te broad-stroke override'lar (cookie tabanlı toggle). **Hover varyantları da override edilmeli**: `hover:text-gray-600/700/800/900` karanlıkta metni koyulaştırıp okunmaz yapıyordu (modallardaki İptal butonu), `globals.css`'te temel `.dark .text-gray-*` eşlemesiyle aynı renklere bağlandı.
- **Navbar mobilde yalnızca bildirim çanı + profil avatarı taşır.** Tema ve dil düğmeleri `sm` altında gizlenip profil menüsünün üstündeki yuvarlak buton şeridine taşınır (`sm:hidden`); şerit `stopPropagation` yapar, yoksa sarmalayıcı div'in onClick'i menüyü kapatır. Dil seçimi kayan toplu bir toggle: `SUPPORTED_LOCALES`'ten üretilen düğmelerin altında `translateX(index * 36)` ile sürünen mor bir top var — **36 sayısı düğmenin `w-9` genişliğine bağlıdır**, boyutu değiştirirsen offset'i de değiştir. Masaüstündeki açılır menüyle **aynı** `changeLocale` fonksiyonunu çağırır (`setLocale` + `router.refresh()`).
- Sistem/ortam/git komutlarını kullanıcı kendisi çalıştırır; ona komutları ver.


## Zaman / timezone (TUZAK)
Tüm `created_at`/`updated_at` kolonları **`timestamp` (timezone'suz)**. Postgres (Supabase, TZ=UTC) doğru UTC yazar — sorun **okumada**.

**Asıl sebep:** `db.execute()` (ham SQL) drizzle'da pg'nin tip parser'larını **atlar** ve timestamp'i ham metin olarak döndürür: `"2026-09-05 11:23:51.841"`. Bu metin JSON'a olduğu gibi girer, tarayıcıdaki `new Date(...)` de timezone taşımayan metni **yerel saat** sayar → UTC+3'te her tarih 3 saat geri görünür. `db.select()` builder'ı bu hataya düşmez; drizzle kolon eşleyicisiyle değeri UTC kabul edip `Date` üretir.

Bu yüzden bozuk olan ekranlar hep ham SQL kullananlardı: mesajlar, bildirimler, arkadaş istekleri, admin "Son Hatalar" / "Güvenlik Olayları" / raporlar.

**Kural: ham SQL'de dışarı dönen her timestamp `AT TIME ZONE 'UTC'` ile sarılır.** Tek kaynak `src/_common/utils/sql-time.ts`:
```ts
SELECT ${utc('n.created_at')} AS created_at   // -> "2026-09-05 11:23:51.841+00"
```
Ofset taşıyan metni her istemci doğru çözer. `utc()` `sql.raw` kullanır — içine **asla kullanıcı girdisi verme**, yalnızca sabit kolon adı.

Destekleyici iki ayar (tek başlarına yetmez, ham SQL yolunu kurtarmaz):
- `main.ts`'in **ilk satırı** `process.env.TZ = 'UTC'` — Node'un yazdığı `Date`'ler UTC duvar saati olsun diye.
- `drizzle.provider.ts`'te `timestamp` OID'i (1114) UTC parse edilir (global + `new Pool({ types })`).

**Açılış logu kendini doğrular:** `✅ Database connected | saat sapması: N dk`. Sorgu bilerek uygulamanın gerçek yolundan geçer (drizzle execute); N 0 değilse timestamp'ler UTC dönmüyordur. Ham `pool.query` ile ölçme — sapmayı gizler, bir kez buna kanıp yanlış yerde arandı.

Frontend'de elle offset **eklenmez**; çeviriyi yalnızca `toLocaleString` / `Intl` yapar.

## Tuzaklar (hepsi bir kez yaşandı)
- **Font Awesome ikonuna tek sınıflı `display` utility'si verme** (`block`, `hidden`). FA'nın CSS'i `layout.tsx`'te CDN `<link>`'i ile Tailwind'den **sonra** yükleniyor; `.fas { display: inline-block }` aynı specificity'de olduğu için `.block` / `.hidden` ezilir — ikon gizlenmez, boş durum ikonu metnin yanına düşer. (Varyantlı hâli, ör. `group-hover:hidden`, iki sınıflı olduğu için çalışır; bu yüzden hata yarı yarıya görünür.) İkonu `<span>`/`<div>` ile sar ve sarmalayıcıyı gizle/göster.
- **DTO'ya alan eklemeden JSONB'ye yeni alan koyma.** Backend'de `ValidationPipe({ whitelist: true }) ` var; DTO'da tanımlı olmayan alan **sessizce silinir**. `note` gibi her yeni `WordPool` alanı `WordPool.request.dto.ts`'e de eklenmeli.
- **`toLocaleLowerCase()` argümansız çağırma.** Makinenin diline göre davranır; sunucu ve tarayıcı farklı sonuç üretir. Cevap karşılaştırmaları `app/lib/answer-match.ts` üzerinden yapılır (dil kodu parametre olarak geçilir) — yeni karşılaştırmalarda da geç.
- **Kelime listesinde düzenleme yaparken objeyi sıfırdan kurma.** `{ ...entry, term, translation }` kullan; `{ term, translation }` yazarsan `note`/`uid` gibi alanlar silinir.
- **Kart içinde `position: fixed` modal açma.** Grup ve marketplace kartlarında `transform hover:scale-[1.02]` var; `transform` containing block yarattığı için `fixed inset-0` viewport'a değil **karta** göre konumlanır, üstüne `overflow-hidden` kırpar. Kart içinden açılan her modal `createPortal(..., document.body)` ile gönderilmeli (bkz. `app/components/game/GameStartButton.tsx`).
- **`.next` bozulursa** route'lar 404 döner (özellikle route grupları). Çözüm: `rm -rf frontend/.next` + yeniden başlat.
