export const metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni - Languruu",
  description: "Languruu kişisel verilerinizin işlenmesi, saklanması ve korunmasına ilişkin detaylar.",
};

export default function PrivacyPage() {
  return (
    <article className="prose max-w-4xl mx-auto py-8 px-4">
      <h1>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
      <p className="updated text-sm text-gray-500">Son güncelleme: 15 Ekim 2024</p>

      <h2>1. Veri Sorumlusunun Kimliği</h2>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla 
        <b> Kayra Özgür (Languruu Proje Sahibi - Kocaeli)</b> (“Languruu”) tarafından aşağıda açıklanan kapsamda işlenmektedir.
        <br />
        <b>İletişim E-postası:</b> [languruu41@gmail.com]
      </p>

      <h2>2. İşlenen Kişisel Veriler ve İşleme Amaçları</h2>
      <p>Aşağıdaki kişisel verileriniz belirtilen amaçlarla işlenmektedir:</p>
      <ul>
        <li>
          <b>Kimlik ve İletişim Verileri (Ad soyad, kullanıcı adı, e-posta):</b> Üyelik hesabının oluşturulması, 
          kimlik doğrulama ve iletişim kurulması.
        </li>
        <li>
          <b>Hesap Güvenliği Verileri (Kriptografik parola özeti - bcrypt, oturum tokenları):</b> Oturum yönetimi ve 
          hesap güvenliğinin sağlanması.
        </li>
        <li>
          <b>Kullanım Verileri (Oluşturulan kelime grupları, çalışma etkinlikleri, profil fotoğrafı):</b> Hizmetin sunulması, 
          öğrenme süreçlerinin takibi ve pazaryeri fonksiyonlarının çalıştırılması.
        </li>
        <li>
          <b>Teknik Veriler ve Trafik Bilgileri (IP adresi, port bilgisi, cihaz/user-agent bilgisi, loglar):</b> 5651 sayılı 
          Kanun uyarınca yasal log saklama yükümlülüğünün yerine getirilmesi ve sistem / işlem güvenliğinin sağlanması.
        </li>
        <li>
          <b>Google ile Giriş Verileri:</b> Google OAuth üzerinden gelen e-posta, ad ve profil fotoğrafı.
        </li>
      </ul>

      <h2>3. Kişisel Veri İşlemenin Hukuki Sebepleri</h2>
      <p>Kişisel verileriniz KVKK Madde 5 uyarınca aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
      <ul>
        <li><b>Sözleşmenin kurulması ve ifası (m.5/2-c):</b> Kullanıcı hesabının açılması ve hizmetin sunulması.</li>
        <li><b>Hukuki yükümlülük (m.5/2-ç):</b> 5651 sayılı Kanun kapsamında trafik bilgilerinin saklanması.</li>
        <li><b>Meşru menfaat (m.5/2-f):</b> Hizmet güvenliğinin ve kalitesinin artırılması.</li>
        <li><b>Açık Rıza (m.5/1 ve m.9):</b> Yurt dışı altyapı sağlayıcılarına veri aktarımı.</li>
      </ul>

      <h2>4. Verilerin Aktarılması ve Yurt Dışı Aktarımı</h2>
      <p>
        Hizmetin kesintisiz sunulabilmesi amacıyla kişisel verileriniz, KVKK Madde 9'a uygun olarak yurt dışında bulunan 
        aşağıdaki altyapı sağlayıcılarının sunucularında işlenmektedir:
      </p>
      <ul>
        <li><b>Supabase Inc.</b> — Veritabanı, kimlik doğrulama ve dosya depolama hizmetleri.</li>
        <li><b>Vercel Inc.</b> — Web uygulaması barındırma ve kenar ağ (CDN) servisleri.</li>
        <li><b>Render Services Inc.</b> — API sunucu barındırma hizmetleri.</li>
        <li><b>Resend Inc.</b> — Transaksiyonel e-posta gönderim altyapısı.</li>
        <li><b>Google LLC</b> — Yalnızca Google ile giriş yapılması halinde kimlik doğrulama.</li>
      </ul>

      <h2>5. Veri Saklama Süresi ve İmha</h2>
      <p>
        Verileriniz hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde, 5651 sayılı Kanun uyarınca saklanması 
        zorunlu olan trafik logları (2 yıl) dışındaki kişisel verileriniz 30 gün içinde silinir veya anonim hale getirilir.
      </p>

      <h2>6. Çerezler (Cookies)</h2>
      <p>
        Yalnızca oturumun sürdürülmesi ve güvenliğin sağlanması amacıyla zorunlu çerezler (HttpOnly JWT tokenlar) kullanılmaktadır. 
        Pazarlama veya üçüncü taraf izleme çerezleri kullanılmaz.
      </p>

      <h2>7. KVKK Madde 11 Kapsamındaki Haklarınız ve Başvuru</h2>
      <p>
        Kişisel veri sahibi olarak; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme, 
        işlemeye itiraz etme haklarına sahipsiniz. Taleplerinizi <b>languruu41@gmail.com</b> adresine iletebilirsiniz. 
        Başvurularınız en geç 30 gün içinde yanıtlanacaktır.
      </p>
    </article>
  );
}