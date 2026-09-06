# Branch Rehberi

## İçindekiler
- [Üç kavram](#üç-kavram)
- [Branch'ler](#brancher)
- [Altın kural: merge commit](#altın-kural-merge-commit)
- [Üç kural](#üç-kural)
- [Senaryo 1 — Normal iş (günlük akış)](#senaryo-1--normal-iş-günlük-akış)
- [Senaryo 2 — Büyük özellik](#senaryo-2--büyük-özellik)
- [Senaryo 3 — Canlıda yangın (hotfix)](#senaryo-3--canlıda-yangın-hotfix)
- [Commit mesajları](#commit-mesajları)
- [Sık yapılan hatalar](#sık-yapılan-hatalar)
- [Günlük kopya kâğıdı](#günlük-kopya-kâğıdı)

---

## Üç kavram

**Branch = defterin bir kopyası.** `production`'dan yeni bir branch açtığın an, canlı
kodun birebir kopyası önüne gelir. Üzerinde ne yaparsan yap, diğer defterler etkilenmez.

**Push = defteri GitHub'a yollamak.** Artık yedekli ve Vercel ona bir Preview URL veriyor.

**PR = "şu defterdeki değişiklikleri şu deftere geçirelim mi?" talebi.**

Sürüm numarası, CHANGELOG, tag **yok**. Canlıdaki kod = `production`'ın son commit'i;
neyin ne zaman çıktığını git geçmişi zaten tutuyor.

## Branch'ler

| Branch | Amaç | Deploy |
|---|---|---|
| `production` | Canlı kod. Sadece PR merge alır, asla direkt commit. | Vercel Production + Render |
| `development` | Günlük iş. Buraya direkt commit atılabilir. | Vercel Preview |
| `next` | Büyük/riskli değişimler (opsiyonel). | Vercel Preview (ayrı URL) |
| `hotfix/*` | Canlıdaki acil hata. `production`'dan kesilir. | Branch Preview |

## Altın kural: merge commit

**PR'lar her zaman "Create a merge commit" ile kapatılır. Squash ve rebase KULLANILMAZ.**

Sebebi tek başına bu rehberdeki karmaşanın yarısını doğuruyordu: squash merge,
`development`'taki commit'leri `production`'da **yeni bir SHA'ya** ezer. `development`
o commit'i tanımadığı için bir sonraki PR'da git aynı dosyaları "iki tarafta bağımsız
değişmiş" sayar ve **dokunmadığın dosyalarda conflict** üretir. Rebase de yeni SHA
ürettiği için aynı sonucu verir.

Merge commit'te `production`, `development`'ın commit'lerini **aynı SHA ile** alır.
İki branch ortak geçmişi paylaşır, git karşılaştıracak bir şey bulamaz, conflict çıkmaz.
"Geri akış" diye bir adım da gerekmez.

> **GitHub ayarı (bir kez yapılır):** Settings → General → Pull Requests →
> *Allow merge commits* **açık**, *Allow squash merging* ve *Allow rebase merging*
> **kapalı**. Kapatınca yanlış butona basma ihtimali de kalmaz.

## Üç kural

1. `production`'a asla direkt commit yok — sadece PR, sadece merge commit.
2. Şema değişikliği varsa migration **canlıya çıkmadan önce** prod DB'ye uygulanır:
   `drizzle/` altındaki üretilmiş SQL, Supabase SQL Editor'den çalıştırılır.
   `start:prod` migration çalıştırmaz, prod'a `drizzle-kit migrate` de atılmaz.
3. `next` kullanılıyorsa haftada bir `git merge development` — yoksa conflict birikir.

---

## Senaryo 1 — Normal iş (günlük akış)

Küçük bir düzeltme de, orta boy bir özellik de aynı yoldan gider.

```bash
git switch development
```

```bash
git pull
```

Kodu yaz, sonra:

```bash
git add -A
```

```bash
git commit -m "feat(study): cumle modu eklendi"
```

```bash
git push origin development
```

Vercel Preview'da kontrol et. Canlıya almaya hazırsan:

**GitHub'da `development → production` PR aç, "Create a merge commit" ile birleştir.**

Bitti. Sürüm yükseltme, CHANGELOG, tag, geri akış — hiçbiri yok.

İki branch'in birebir aynı görünmesini istersen (zorunlu değil, merge commit'i
`development`'a da alır, fast-forward olur):

```bash
git switch development && git pull origin production && git push origin development
```

## Senaryo 2 — Büyük özellik

### Yol A — Feature flag ile `development` (tercih edilen)

Kod yazılır ama bayrak arkasında saklanır:

```tsx
{process.env.NEXT_PUBLIC_FEATURE_DUELLO === "1" && <DuelloPanel />}
```

Vercel'de bu değişken **sadece Preview** ortamına eklenir, Production'a eklenmez.
Kod canlıda durur ama görünmez. Akış Senaryo 1 ile birebir aynıdır.

**Neden bu daha iyi:** kod sürekli `development` ile birleşir, conflict birikmez.
Özellik bitince yapılan tek şey bayrağı Production ortamına da eklemektir.

### Yol B — `next` branch'i

Değişiklik gerçekten kırıcıysa (şema değişikliği, yeni backend servisi) bayrak yetmez:

```bash
git switch next && git pull && git merge development
```

Özellik bitince `next → development` PR'ı açılır (yine merge commit) ve normal akışa
dönülür.

## Senaryo 3 — Canlıda yangın (hotfix)

`development`'ta yayına hazır olmayan işler varken canlıdaki bir hatayı düzeltmen
gerekiyorsa, `development`'tan **kesme** — yarım işleri de canlıya taşırsın.

```bash
git switch production
```

```bash
git pull
```

```bash
git switch -c hotfix/kayit-hatasi
```

Düzelt, commit'le, push'la:

```bash
git push -u origin hotfix/kayit-hatasi
```

**PR hedefi `production`**, merge commit ile birleştir. Fix canlıda.

Şimdi fix sadece `production`'da; `development`'ın haberi yok. Aynı gün al:

```bash
git switch development && git pull && git merge origin/production
```

```bash
git push origin development
```

Merge commit kullandığın için bu birleşme temiz gelir — ortak geçmiş var.

## Commit mesajları

[Conventional Commits](https://www.conventionalcommits.org/) alışkanlığı sürüyor,
ama artık sürüm numarası üretmediği için **zorunlu değil**, sadece geçmişi okunur
tutuyor:

```
feat(study): cumle modu eklendi
fix(auth): logout sirasinda refresh token temizlenmiyordu
chore(deps): next 16.3'e yukseltildi
docs(branching): merge commit kurali
```

## Sık yapılan hatalar

1. **PR'ı squash veya rebase ile kapatmak.** Conflict fabrikasını geri açar.
   GitHub ayarından ikisini de kapat, konu kapansın.
2. **`git pull` atmadan çalışmaya başlamak.** Bayat koddan başlarsın, gereksiz conflict.
3. **Hotfix'i `development`'tan kesmek.** Yayına hazır olmayan işleri canlıya taşırsın.
4. **Hotfix'i `development`'a almayı unutmak.** Düzelttiğin bug bir sonraki merge'de
   geri gelir.
5. **Migration'ı atlamak.** Şema değiştiyse prod DB'ye uygulanmadan merge etme.
6. **`production`'a direkt push denemek.** Branch koruması reddeder.

## Günlük kopya kâğıdı

```bash
git status -sb                                          # neredeyim
git diff --stat origin/production origin/development    # yayinlanmamis ne var
git log --oneline origin/production..origin/development # hangi commitler cikacak
```

```
Yeni iş     → git switch development && git pull   (sonra commit + push + PR)
Büyük iş    → aynısı + feature flag   |   git switch next && git pull && git merge development
YANGIN      → git switch production && git pull && git switch -c hotfix/ad
```
