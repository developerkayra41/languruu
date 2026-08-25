# Branch ve Sürüm Rehberi

## Branch'ler

| Branch | Amaç | Deploy |
|---|---|---|
| `production` | Canlı kod. Sadece PR merge alır, asla direkt commit. | Vercel Production + Render |
| `development` | Bir sonraki küçük sürüm: bugfix, mini özellik. | Vercel Preview |
| `next` | Büyük/riskli değişimler (yeni çalışma modları, socket.io). | Vercel Preview (ayrı URL) |
| `feature/*` | Tek bir iş. Kısa ömürlü, bitince silinir. | — |
| `hotfix/*` | Canlıdaki acil hata. `production`'dan kesilir. | — |

## Dört kural

1. `production`'a asla direkt commit yok — sadece PR.
2. `next` haftada bir `development`'i kendine ceker (`git merge development`).
   Yapilmazsa conflict birikir; long-lived branch'lerin tek olum sebebi budur.
3. Bir hotfix `production`'a gittiginde ayni gun `development`'a da merge edilir,
   yoksa bir sonraki surumde regresyon olarak geri gelir.
4. Local `production` branch'i guncel tutulmali (`git fetch` + `git branch -f`),
   yoksa `git log production..development` yanlis bilgi verir.

## Akislar

### Kucuk is (bugfix, mini ozellik)
```
git switch development && git pull
git switch -c feature/kisa-ad
# ... commit'ler ...
git push -u origin feature/kisa-ad
# GitHub'da feature/* -> development PR, squash merge
```

### Buyuk is (yeni calisma modu vb.)
```
git switch next && git pull
git merge development          # once guncelle
git switch -c feature/kisa-ad
# ... commit'ler ...
# PR hedefi: next
```
Bitince: `next -> development` PR, sonra normal surum akisi.

### Hotfix
```
git switch production && git pull
git switch -c hotfix/kisa-ad
# ... fix ...
# PR hedefi: production -> merge -> tag (patch)
# ARDINDAN: production -> development PR (geri akis)
```

## Feature flag

Buyuk ozellikler `next` branch'inde beklemek yerine, bayrak arkasinda
`development`'a erken merge edilebilir. Tercih edilen yontem budur:
merge cehennemi olusmaz, kod canlida kapali durur.

```
NEXT_PUBLIC_FEATURE_SENTENCE_MODE=1   # Vercel Preview'da acik, Production'da yok
```

`next` branch'i yalnizca gercekten kirici degisimler icin kullanilir
(sema degisikligi, yeni backend servisi gerektiren isler).

## Surumleme (SemVer)

`MAJOR.MINOR.PATCH` — monorepo tek numara ile ilerler (frontend + backend ayni).

- **PATCH** (1.2.**3**): hata duzeltmesi, metin duzeltmesi
- **MINOR** (1.**2**.0): geriye uyumlu yeni ozellik
- **MAJOR** (**1**.0.0): kirici degisiklik

## Commit mesajlari (Conventional Commits)

```
feat(study): cumle modu eklendi
fix(auth): logout sirasinda refresh token temizlenmiyordu
chore(deps): next 16.3'e yukseltildi
docs(readme): kurulum adimlari guncellendi
```

`feat` -> MINOR, `fix` -> PATCH, `feat!:` veya `BREAKING CHANGE:` -> MAJOR.
Aciklama Turkce serbest; onemli olan basdaki etiket.

## Yayin rutini (her seferinde ayni 6 adim)

1. `development` yesil mi? Iki projede de `npm run build`, i18n parity kontrolu.
2. `CHANGELOG.md`'ye yeni surum basligini yaz.
3. Surumu yukselt: iki pakette de `npm version <patch|minor|major> --no-git-tag-version`.
4. `development -> production` PR ac, **squash merge**.
5. `production`'da tag at: `git tag -a vX.Y.Z -m "..."` + `git push origin vX.Y.Z`.
6. Vercel/Render deploy'unu dogrula, `/health` surumunu kontrol et.
