import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('mail.RESEND_API_KEY'));
    this.from = this.config.get<string>('mail.MAIL_FROM') ?? 'onbaording@resend.dev';
    this.appUrl = this.config.get<string>('mail.APP_URL') ?? 'http://localhost:3000';
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/verify-email?token=${token}`;
    const html = this.buildEmail({
      heading: "E-posta adresini doğrula",
      body: "Languruu'ya hoş geldin! Hesabını kullanmaya başlamak için e-posta adresini doğrulaman yeterli. Aşağıdaki butona tıkla — bu bağlantı 24 saat geçerli.",
      buttonText: "E-postamı doğrula",
      buttonLink: link,
      footerNote: "Bu hesabı sen oluşturmadıysan bu e-postayı görmezden gelebilirsin.",
    });
    await this.send(to, "Languruu — E-posta adresini doğrula", html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    const html = this.buildEmail({
      heading: "Şifreni sıfırla",
      body: "Şifre sıfırlama talebi aldık. Yeni şifreni belirlemek için aşağıdaki butona tıkla — bu bağlantı 1 saat geçerli.",
      buttonText: "Şifremi sıfırla",
      buttonLink: link,
      footerNote: "Bu talebi sen yapmadıysan bu e-postayı görmezden gelebilirsin; şifren değişmez.",
    });
    await this.send(to, "Languruu — Şifre sıfırlama", html);
  }

  async sendReengagementEmail(to: string, opts?: { name?: string | null; unsubscribeToken?: string | null }): Promise<boolean> {
    const link = `${this.appUrl}/study`;
    const name = (opts?.name ?? '').trim().split(/\s+/)[0];
    const greeting = name ? `Merhaba ${this.escapeHtml(name)},` : 'Merhaba,';
    const unsubscribeLink = opts?.unsubscribeToken
      ? `${this.appUrl}/unsubscribe?t=${encodeURIComponent(opts.unsubscribeToken)}`
      : undefined;

    const bullet = (icon: string, title: string, text: string) => `
      <tr>
        <td style="padding:0 0 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="34" valign="top" style="font-size:18px;line-height:1.4;">${icon}</td>
              <td valign="top" style="font-size:14px;line-height:1.6;color:#4b5563;">
                <b style="color:#1f2937;">${title}</b><br />${text}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

    const bodyHtml = `
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4b5563;">${greeting}</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4b5563;">
                Bir haftadır Languruu'ya uğramadın. Belki işler yoğunlaştı, belki araya başka şeyler girdi —
                olur öyle. İyi haber şu: <b style="color:#1f2937;">kelimelerin tam bıraktığın yerde duruyor.</b>
              </p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#4b5563;">
                Bugün sadece <b style="color:#1f2937;">5 dakika</b> ayırsan bir turu bitirir, serini yeniden başlatırsın.
                Bize bir şans daha vermek ister misin?
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 26px;padding:20px 20px 6px;background-color:#faf9ff;border:1px solid #ede9fe;border-radius:12px;">
                ${bullet('🎵', 'Şarkı sözü grupları', 'Sevdiğin şarkının sözlerini mısra mısra çalış — yeni geldi.')}
                ${bullet('⚡', 'Yarış modu', 'Arkadaşlarınla karşılaş, skor topla, seviye atla.')}
                ${bullet('🛒', 'Pazar yeri', 'Başkalarının hazırladığı hazır setleri tek tıkla kütüphanene ekle.')}
              </table>`;

    const html = this.buildEmail({
      heading: 'Kaldığın yerden devam edelim mi?',
      preheader: 'Kelimelerin tam bıraktığın yerde seni bekliyor — 5 dakika yeter.',
      bodyHtml,
      buttonText: 'Çalışmaya dön',
      buttonLink: link,
      footerNote: "Bu e-postayı, bir süredir Languruu'ya uğramadığın için gönderdik. Görüşmek üzere!",
      showLinkFallback: false,
      unsubscribeLink,
    });
    return await this.send(to, "Languruu'ya bir şans daha? 👋 Kelimelerin seni bekliyor", html);
  }

  private escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const res = await this.resend.emails.send({ from: this.from, to, subject, html });
      if ((res as any)?.error) {
        this.logger.error(`Mail gönderilemedi ${to}: ${subject} — ${(res as any).error?.message ?? ''}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Mail gönderilemedi ${to}: ${subject}`, err as Error);
      return false;
    }
  }

  async sendErrorAlert(to: string, err: { message: string; stack?: string; path?: string; method?: string; userId?: number | null }): Promise<void> {
    const esc = (s: string) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `
      <div style="font-family:monospace;font-size:13px;">
        <h2 style="color:#e11d48;margin:0 0 12px;">🚨 Languruu — Sunucu Hatası (500)</h2>
        <p><b>Mesaj:</b> ${esc(err.message)}</p>
        <p><b>Endpoint:</b> ${esc(err.method ?? "")} ${esc(err.path ?? "")}</p>
        <p><b>Kullanıcı:</b> ${err.userId ?? "-"}</p>
        <pre style="background:#f3f4f6;padding:12px;border-radius:8px;overflow:auto;">${esc(err.stack ?? "")}</pre>
      </div>`;
    await this.send(to, "🚨 Languruu 500 hatası", html);
  }

  private buildEmail(opts: {
    heading: string; body?: string; bodyHtml?: string; buttonText: string; buttonLink: string;
    footerNote: string; preheader?: string; unsubscribeLink?: string; showLinkFallback?: boolean;
  }): string {
    const bodyBlock = opts.bodyHtml
      ?? `<p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">${opts.body ?? ''}</p>`;
    const linkFallback = opts.showLinkFallback === false ? '' : `
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
                Buton çalışmazsa bu bağlantıyı tarayıcına kopyala:<br />
                <a href="${opts.buttonLink}" style="color:#7c3aed;">${opts.buttonLink}</a>
              </p>`;
    const unsubscribeBlock = opts.unsubscribeLink ? `
              <p style="margin:8px 0 0;font-size:12px;color:#b0b6bf;">
                Bu e-postaları almak istemiyorsan <a href="${opts.unsubscribeLink}" style="color:#9ca3af;text-decoration:underline;">aboneliğini tek tıkla durdurabilirsin</a>.
              </p>` : '';
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Languruu</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3f4f6;">${opts.preheader ?? opts.heading}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%);padding:36px 32px;text-align:center;">
          <img style='width:200px;' src='https://xlteiuydlvdmommtdlcf.supabase.co/storage/v1/object/public/logos/logo-for-email.png' alt="Languruu"/>  
              </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#1f2937;">${opts.heading}</h1>
              ${bodyBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:9999px;background-color:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%);">
                    <a href="${opts.buttonLink}" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">${opts.buttonText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">${opts.footerNote}</p>
              ${linkFallback}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background-color:#f9fafb;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© Languruu · Kelime öğrenme uygulaması</p>${unsubscribeBlock}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
