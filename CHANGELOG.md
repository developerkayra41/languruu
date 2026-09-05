# Değişiklik Günlüğü

Bu projenin tüm kayda değer değişiklikleri bu dosyada tutulur.
Format [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) temellidir,
sürümleme [SemVer](https://semver.org/lang/tr/) kurallarına uyar.

## [Yayınlanmamış]

## [1.4.0] - 2026-09-05

### Eklendi
- Genel sohbet: sağ alttaki butonla açılan, ekranın sağında tam yükseklikte
  panel. Giriş yapmış herkes okuyup yazabiliyor, arkadaşlık şartı yok. Kişi
  kendi mesajını düzenleyip silebiliyor; mesajlar gönderildikten 7 gün sonra
  otomatik siliniyor.
- Genel sohbette her mesajda üç nokta menüsü: kendi mesajında düzenle ve sil,
  başkasının mesajında bildir.
- Genel sohbet mesajları mevcut şikayet altyapısına bildiriliyor. Admin
  panelindeki şikayet kartı, bildirilen mesajın metnini ve yazarını gösteriyor;
  mesaj silinmiş veya süresi dolmuşsa bunu belirtiyor.
- Admin genel sohbetteki her mesajı silebiliyor: hem sohbet panelindeki üç
  nokta menüsünden, hem admin panelindeki şikayet kartından (oradan silince
  şikayet de kapanıyor). Başkasının mesajını düzenleyemiyor.
- Genel sohbete küfür filtresi: uygunsuz ifade içeren mesaj gönderilemiyor ve
  kaydedilemiyor. Filtre serbest metne göre ayarlandı, Türkçede `ı`/`i` ayrımını
  koruduğu için "sıkıntı", "götürmek", "şikayet" gibi kelimeler engellenmiyor.

### Düzeltildi
- Oturum yenilenemediğinde middleware, sayfa isteklerinin yanı sıra Server
  Action isteklerini de `/login`'e yönlendiriyordu. Tarayıcı yönlendirmeyi
  takip ederken POST'u tekrarladığı için ekrana "An unexpected response was
  received from the server" hatası düşüyordu. Aksiyon istekleri artık
  yönlendirilmiyor; oturum gerçekten geçersizse giriş sayfasına normal şekilde
  dönülüyor.

## [1.3.0] - 2026-09-05

### Eklendi
- Arkadaşlık sistemi: başka bir kullanıcının profilinde "Arkadaş Ekle" butonu,
  istek gönderme / geri çekme, kabul-ret ve arkadaşlıktan çıkarma. Karşılıklı
  istek gönderilirse ikinci istek otomatik kabule dönüşür.
- Bildirim sistemi: navbar'da okunmamış rozeti taşıyan çan butonu, kendi
  profilinde Bildirimler / İstekler / Arkadaşlar kısayolları ve `/notifications`
  sayfası (üç sekme).
- Kütüphaneden bir kelime grubu ilk kez kopyalandığında grup sahibine
  "X kelime grubunuzu kaydetti" bildirimi gidiyor.
- Mesajlaşma: yalnızca arkadaşlar birbirine yazabiliyor. Profillerde zarf
  butonu (arkadaş değilse uyarı), profil menüsünde okunmamış gönderen sayısını
  gösteren Mesajlar satırı, `/messages` listesi ve yazışma ekranı. Mesaj
  gelince bildirim düşüyor (aynı kişiden gelen okunmamış bildirim tazelenir,
  çoğalmaz).
- Mesajlarda "görüldü" bilgisi yok; gönderim tarihi ve saati tutulur. Kişi
  yalnızca kendi mesajını silebilir veya düzenleyebilir; silinen mesaj iki
  taraftan da kalkar, düzenlenen mesajın altında "(düzenlendi)" yazar. Her
  mesaj gönderildikten 7 gün sonra otomatik silinir.
- Arkadaş olunan profillerde buton açık yeşil "Arkadaşsınız" + tikli kişi
  ikonu; hover'da kırmızı "Arkadaşlıktan Çıkar" + çarpılı kişi ikonu.
- Mesajlar ve bildirimler ekranları açık temada yumuşatıldı: odak halkası ince
  ve soluk mor, kart kenarları belirginleşti, boş durum ikonları soluklaştı,
  gönderilen mesaj baloncuğu bir ton açıldı.
- Yazışma ekranındaki kaydırma çubuğu Languruu temasına uyduruldu
  (`.pretty-scroll`). Mesaj düzenle/sil işlemleri baloncuğun sağ üstündeki üç
  nokta menüsüne taşındı.

### Düzeltildi
- Mesajlar bölümünde geri tuşu liste ile yazışma arasında döngüye giriyordu;
  bölüm artık geçmişte tek kayıt tutuyor ve geri tuşu bölüme girmeden önceki
  sayfaya dönüyor.
- Bildirim satırında göreli zaman ile eylem linki bitişik yazılıyordu.
- Profildeki "Arkadaşsınız" butonunda iki ikon aynı anda görünüyordu; Font
  Awesome'ın CSS'i Tailwind'in `hidden` sınıfını eziyordu.
- Boş durum ikonları (mesaj/bildirim listeleri) metnin üstünde değil yanında
  duruyordu; Font Awesome'ın CSS'i Tailwind'in `block` sınıfını eziyordu.
- Karanlık modda `hover:text-gray-*` kullanan butonların (ör. Şikayet Et
  modalindeki İptal) yazısı hover'da kararıp okunmaz oluyordu.
- Tarih ve saatler 3 saat geri gösteriliyordu (yeni mesaj "3 saat önce", admin
  panelinde güvenlik olayları ve son hatalar geride). Ham SQL sorguları
  timestamp'i timezone taşımayan metin olarak döndürüyor, tarayıcı da bunu
  yerel saat sayıyordu; dışarı dönen tüm timestamp'ler artık UTC ofseti ile
  gönderiliyor.

### Değiştirildi
- `NEXT_PUBLIC_FEATURE_SENTENCE_MODE` bayrağı kaldırıldı; cümle özelliği ve
  Cümleli mod artık kalıcı olarak açık. `app/lib/features.ts` silindi.

## [1.2.0] - 2026-09-01

### Eklendi
- Çalışma ilerlemesi tarayıcıda saklanıyor; gruba geri dönünce kaldığın sorudan
  devam ediliyor (Klasik ve Cümleli modlar). Grubun kelimeleri değişirse
  eskiyen kayıt kendini toparlar, yeni kelimeler sıranın sonuna eklenir.

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

Cümle özelliği bu sürümde `NEXT_PUBLIC_FEATURE_SENTENCE_MODE` bayrağı
arkasındaydı; bayrak 1.2.1'de kaldırıldı.

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
