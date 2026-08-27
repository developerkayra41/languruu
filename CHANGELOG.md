# Değişiklik Günlüğü

Bu projenin tüm kayda değer değişiklikleri bu dosyada tutulur.
Format [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) temellidir,
sürümleme [SemVer](https://semver.org/lang/tr/) kurallarına uyar.

## [Yayınlanmamış]

## [1.1.0] - 2026-08-27

### Eklendi
- Kelimelere örnek cümle ve çevirisi eklenebiliyor (kelime başına en fazla 3).
- Çalışma ekranına "Cümleli" modu: önce kelime sorulur, doğru bilinince aynı
  kelimenin örnek cümlesi sorulur (yaz → çeviriyi göster → bildim/bilemedim).
  Enter ve Esc kısayolları destekleniyor.
- Çalışma ekranı mod altyapısı: modlar `study/modes/` altında kayıt defterinden
  besleniyor, yeni mod eklemek bir klasör + bir kayıt.
- Cümleli mod yalnızca grupta örnek cümleli kelime varsa listeleniyor.

### Düzeltildi
- Karanlık modda mor yüzeyler (`bg-purple-50`, `bg-purple-100`) açık renk
  kalıyordu; karanlık mod karşılıkları eklendi.

Cümle özelliği `NEXT_PUBLIC_FEATURE_SENTENCE_MODE` bayrağı arkasındadır;
bayrak tanımlı değilken kullanıcı arayüzünde hiçbir değişiklik görünmez.

## [1.0.0] - 2026-08-26

İlk sürümlenmiş yayın. Bu tarihe kadar geliştirilen özellikler tek bir başlangıç
noktası olarak kayıt altına alınmıştır.

### Eklendi
- Kelime grupları: oluşturma, düzenleme, silme; grup başına kaynak/hedef dil.
- Çalışma ekranı: üç yön modu (kelime→anlam, anlam→kelime, karışık), sesli okuma,
  kelime notu, tur tamamlama animasyonu.
- Kütüphane (marketplace): grup paylaşma ve hazır setleri kopyalama.
- İstatistikler: günlük seri, tamamlanan tur, kelime havuzu, toplam kelime.
- Top performers: 10 dakikada bir güncellenen sıralama.
- Kimlik doğrulama: JWT + refresh token rotasyonu, hırsızlık tespiti,
  Google ile giriş, e-posta doğrulama, şifre sıfırlama.
- Yönetim paneli: kullanıcı yönetimi, raporlar, hata kayıtları.
- Pazarlama ve SEO: TR/EN ana sayfa, MDX blog, sitemap, JSON-LD, dinamik OG görseli.
- i18n: Türkçe ve İngilizce.
- Sürüm altyapısı: CHANGELOG, SemVer sürüm numaraları, branch/sürüm rehberi (docs/BRANCHING.md).

### Değişti
- Marketplace etiketi arayüzde "Kütüphane" olarak değiştirildi (route ve tablo adları aynı kaldı).
