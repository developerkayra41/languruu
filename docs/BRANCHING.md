# Branch ve Sürüm Rehberi

## İçindekiler
- [Dört kavram](#dört-kavram)
- [Altın kural: iki soru](#altın-kural-iki-soru)
- [Branch'ler](#brancher)
- [Dört kural](#dört-kural)
- [Senaryo 1 — Ufak bug / mini özellik](#senaryo-1--ufak-bug--mini-özellik)
- [Senaryo 2 — Büyük özellik](#senaryo-2--büyük-özellik)
- [Senaryo 3 — Büyük özellik yarıdayken canlıda yangın](#senaryo-3--büyük-özellik-yarıdayken-canlıda-yangın)
- [Senaryo 4 — Normal sürüm çıkarmak](#senaryo-4--normal-sürüm-çıkarmak)
- [Sürümleme (SemVer)](#sürümleme-semver)
- [Commit mesajları](#commit-mesajları)
- [Sık yapılan hatalar](#sık-yapılan-hatalar)
- [Günlük kopya kâğıdı](#günlük-kopya-kâğıdı)

---

## Dört kavram

**Branch = defterin bir kopyası.** `production`'dan yeni bir branch açtığın an, canlı
kodun birebir kopyası önüne gelir. Üzerinde ne yaparsan yap, diğer defterler etkilenmez.

**Commit = o deftere kaydetmek.** Sadece kendi makinende; GitHub'ın haberi yok.

**Push = defteri GitHub'a yollamak.** Artık yedekli ve Vercel ona bir Preview URL veriyor.

**PR = "şu defterdeki değişiklikleri şu deftere geçirelim mi?" talebi.**

Bunların üstünde tek bir şey var: **branch'i nereden kestiğin ve nereye PR açtığın,
o işin kaderini belirler.** Yanlış yerden kesersen istemediğin kodları da beraberinde
taşırsın.

## Altın kural: iki soru

**Soru 1 — Bu iş canlıya ne zaman çıkmalı?**
- *Hemen, bugün* → `production`'dan kes (hotfix)
- *Bir sonraki normal sürümde* → `development`'tan kes
- *Çok sonra, henüz belli değil* → `next`'ten kes (ya da feature flag ile `development`)

**Soru 2 — Nereden kestiysen, PR'ı oraya açarsın.**

## Branch'ler

| Branch | Amaç | Deploy |
|---|---|---|
| `production` | Canlı kod. Sadece PR merge alır, asla direkt commit. | Vercel Production + Render |
| `development` | Bir sonraki küçük sürüm: bugfix, mini özellik. | Vercel Preview |
| `next` | Büyük/riskli değişimler (yeni çalışma modları, socket.io). | Vercel Preview (ayrı URL) |
| `feature/*` | Tek bir iş. Kısa ömürlü, bitince silinir. | Branch Preview |
| `hotfix/*` | Canlıdaki acil hata. `production`'dan kesilir. | Branch Preview |

## Dört kural

1. `production`'a asla direkt commit yok — sadece PR.
2. `next` haftada bir `development`'ı kendine çeker (`git merge development`).
   Yapılmazsa conflict birikir; long-lived branch'lerin tek ölüm sebebi budur.
3. Bir hotfix `production`'a gittiğinde **aynı gün** `development`'a da merge edilir
   (geri akış), yoksa bir sonraki sürümde regresyon olarak geri gelir.
4. Local `production` branch'i bayatlar; kıyaslamadan önce
   `git fetch` + `git branch -f production origin/production`.

---

## Senaryo 1 — Ufak bug / mini özellik

*Örnek: profil sayfasında tarih formatı yanlış. Acil değil.*

```bash
git switch development
git pull
git switch -c fix/profil-tarih-formati
```

İlk iki satır kritik: `development`'ın **güncel** halinden kesmek istiyorsun.

Kodu düzelt, sonra:

```bash
git add .
git commit -m "fix(profile): tarih formati yerel ayara gore gosteriliyor"
git push -u origin fix/profil-tarih-formati
```

`-u` sadece ilk push'ta gerekli. GitHub'da **PR aç, hedef `development`**, squash merge.

Temizlik:

```bash
git switch development
git pull
git branch -d fix/profil-tarih-formati
```

İş artık `development`'ta bekliyor, canlıda değil. Birkaç iş biriktirip hep birlikte
yayınlanır (Senaryo 4).

---

## Senaryo 2 — Büyük özellik

### Yol A — Feature flag ile `development` (tercih edilen)

Kod yazılır ama bayrak arkasında saklanır:

```tsx
{process.env.NEXT_PUBLIC_FEATURE_DUELLO === "1" && <DuelloPanel />}
```

Vercel'de bu değişken **sadece Preview** ortamına eklenir, Production'a eklenmez.
Kod canlıda durur ama görünmez. Branch akışı Senaryo 1 ile birebir aynıdır.

**Neden bu daha iyi:** kod sürekli `development` ile birleşir, conflict birikmez.
Özellik bitince yapılan tek şey bayrağı Production ortamına da eklemektir.

### Yol B — `next` branch'i

Değişiklik gerçekten kırıcıysa (şema değişikliği, yeni backend servisi) bayrak yetmez:

```bash
git switch next
git pull
git merge development
git switch -c feature/duello-socket
```

PR hedefi **`next`**. Özellik bitince `next → development` PR'ı açılır ve normal
akışa dönülür.

> `next` kullanılıyorsa haftada bir `git merge development` şart.

---

## Senaryo 3 — Büyük özellik yarıdayken canlıda yangın

*Durum: `feature/sentence-mode` üzerinde 3 gündür çalışılıyor, yarım.
Canlıda "kayıt olamıyorum" hatası çıktı.*

Kilit kavram: **yarım iş kaybolmaz, sadece başka deftere geçilir.**

### 1. Yarım işi güvene al

Commit edilmemiş değişiklikler branch değiştirince peşinden sürüklenir. İki çözüm:

```bash
git add .
git commit -m "wip: cumle modu, yarim"
```

Kendi feature branch'in, istediğin kadar çirkin commit at — squash merge hepsini
tek satıra indirecek. Alternatif olarak `git stash push -m "cumle modu yarim"`
(unutmaya müsait, commit tercih edilir).

### 2. Hotfix branch'ini `production`'dan kes

```bash
git switch production
git pull
git switch -c hotfix/kayit-hatasi
```

**Neden `development`'tan değil?** `development`'ta canlıya çıkmamış başka işler var.
Oradan kesersen o yarım işleri de canlıya taşırsın. `production`'dan kesmek =
"sadece canlıdaki kod + tek satırlık fix".

### 3. Düzelt ve push'la

```bash
git add .
git commit -m "fix(auth): kayit sirasinda dogrulama maili gonderilmiyordu"
git push -u origin hotfix/kayit-hatasi
```

Vercel bu branch'e Preview URL verir — **merge etmeden önce orada test et.**
Acil diye atlanacak adım değil; hotfix'ler en çok hata yapılan yerdir.

### 4. PR hedefi `production`

Squash merge. Fix canlıda.

### 5. Sürümle (PATCH)

```bash
git fetch origin
git tag -a v1.0.1 origin/production -m "kayit hatasi duzeltmesi"
git push origin v1.0.1
```

`CHANGELOG.md`'ye de bir satır ekle.

### 6. GERİ AKIŞ — en çok unutulan adım

Fix şu an sadece `production`'da. Hiçbir şey yapılmazsa bir sonraki sürümde
`development` canlıya çıkar ve **eski bozuk kodu geri getirir** (regresyon).
Aynı gün yap:

```bash
git switch development
git pull
git merge production
git push origin development
```

`next` branch'i varsa:

```bash
git switch next
git pull
git merge development
git push origin next
```

### 7. Yarım işe dön

```bash
git switch feature/sentence-mode
git merge development
```

Stash kullanıldıysa `git stash pop`. Kaldığın yerden devam.

### Şema

```
production  ──●──────────────────●──────────────  (v1.0.0)      (v1.0.1)
               \                ↗ \
                \   hotfix ────●    \  geri akış
                 \                   ↘
development ──●───●───────────────────●─────────
                   \                   \
feature/    ────────●───●───●───────────●───●──  (kaldığın yerden devam)
sentence-mode
```

---

## Senaryo 4 — Normal sürüm çıkarmak

`development`'ta birkaç iş birikti, canlıya alma zamanı:

**1.** Build kontrolü:

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

**2.** i18n parity kontrolü (bkz. `CLAUDE.md`).

**3.** `CHANGELOG.md`'de `[Yayınlanmamış]` başlığını gerçek sürüme çevir, üstüne
yeni bir boş `## [Yayınlanmamış]` bırak.

**4.** Sürümü yükselt — her iki pakette de:

```bash
cd frontend && npm version minor --no-git-tag-version
cd ../backend && npm version minor --no-git-tag-version
```

`--no-git-tag-version` şart: tag `production`'da atılır, `development`'ta değil.

**5.** Commit ve push:

```bash
git commit -am "chore(release): 1.1.0"
git push origin development
```

**6.** GitHub'da `development → production` PR, **squash merge**.

**7.** Tag:

```bash
git fetch origin
git tag -a v1.1.0 origin/production -m "Cumle modu"
git push origin v1.1.0
```

**8.** Canlıyı doğrula: siteyi aç, backend `/health` sürümünü kontrol et.

**9. Production'ı `development`'a geri merge et — atlama.**

```bash
git fetch origin
git checkout development
git merge origin/production -m "merge: production geri akisi (squash), agac development esas"
git push origin development
```

Squash merge, `development`'taki onlarca commit'i `production`'da **tek yeni
commit**'e ezer. `development` o commit'i tanımadığı için bir sonraki PR'da
git aynı dosyaları "iki tarafta da bağımsız değişmiş" sayar ve **conflict**
üretir — hem de dokunmadığın dosyalarda. Geri akış bunu kapatır.

Conflict çıkarsa: `production`'da `development`'ta olmayan bir şey **yoksa**
(tek commit squash'ın kendisiyse) hepsini development lehine al —

```bash
git merge -X ours origin/production -m "merge: production geri akisi"
```

`-X ours` yalnızca çakışan hunk'larda `development`'ı seçer. Önce
`git log --oneline development..origin/production` ile production tarafında
gerçek bir hotfix olmadığını doğrula; varsa `-X ours` onu yutar.

---

## Sürümleme (SemVer)

`MAJOR.MINOR.PATCH` — monorepo tek numara ile ilerler (frontend + backend aynı).

| Durum | Numara | Örnek |
|---|---|---|
| Bug fix, metin/stil düzeltmesi | **PATCH** | 1.0.0 → 1.0.**1** |
| Yeni özellik, mevcut hiçbir şeyi bozmuyor | **MINOR** | 1.0.1 → 1.**1**.0 |
| Kırıcı değişiklik | **MAJOR** | 1.1.0 → **2**.0.0 |

MINOR artınca PATCH sıfırlanır, MAJOR artınca ikisi de sıfırlanır.
Web uygulamasında MAJOR neredeyse hiç gerekmez — kullanıcı daima en son sürümdedir.

### Tag'ler
Yayınlanmış bir tag **taşınmaz**. Yanlış commit'e atıldıysa ve henüz kimse
çekmediyse taşınabilir, ama alışkanlık haline getirilmez. Doğru sıra:
önce merge, sonra tag.

## Commit mesajları

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(study): cumle modu eklendi
fix(auth): logout sirasinda refresh token temizlenmiyordu
chore(deps): next 16.3'e yukseltildi
docs(branching): senaryolar eklendi
```

`feat` → MINOR, `fix` → PATCH, `feat!:` veya `BREAKING CHANGE:` → MAJOR.
Açıklama Türkçe serbest; önemli olan baştaki etiket.

## Sık yapılan hatalar

1. **`git pull` atmadan branch kesmek.** Bayat koddan başlarsın, gereksiz conflict.
   Her `switch`'ten sonra `pull` refleksi edin.
2. **Hotfix'i `development`'tan kesmek.** Yayına hazır olmayan işleri canlıya taşırsın.
3. **Geri akışı unutmak.** Düzeltilen bug bir sonraki sürümde geri gelir.
4. **`next`'i aylarca güncellememek.** Merge cehennemi.
5. **`production`'a direkt push denemek.** Branch koruması reddeder.
6. **Squash sonrası commit sayısına bakmak.** Squash yeni SHA ürettiği için
   `production..development` her zaman fark gösterir. Doğru ölçü `git diff`'tir.

## Günlük kopya kâğıdı

```bash
git status -sb                                          # neredeyim
git diff --stat origin/production origin/development    # yayinlanmamis bir sey var mi
git ls-remote origin refs/heads/production              # canlida hangi commit var
```

```
Yeni iş (küçük)  → git switch development && git pull && git switch -c fix/ad
Yeni iş (büyük)  → aynısı + feature flag   |   git switch next && git pull && git switch -c feature/ad
YANGIN           → git switch production && git pull && git switch -c hotfix/ad
```
