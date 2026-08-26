# Değişiklik Günlüğü

Bu projenin tüm kayda değer değişiklikleri bu dosyada tutulur.
Format [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) temellidir,
sürümleme [SemVer](https://semver.org/lang/tr/) kurallarına uyar.

## [Yayınlanmamış]

### Değişti
- Marketplace etiketi arayüzde "Kütüphane" olarak değiştirildi (route ve tablo adları aynı kaldı).

## [1.0.0] - 2026-08-25

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
