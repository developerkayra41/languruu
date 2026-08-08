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

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Mail gönderilemedi ${to}: ${subject}`, err as Error);
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
    heading: string; body: string; buttonText: string; buttonLink: string; footerNote: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Languruu</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3f4f6;">${opts.heading}</span>
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
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4b5563;">${opts.body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:9999px;background-color:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%);">
                    <a href="${opts.buttonLink}" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">${opts.buttonText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">${opts.footerNote}</p>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
                Buton çalışmazsa bu bağlantıyı tarayıcına kopyala:<br />
                <a href="${opts.buttonLink}" style="color:#7c3aed;">${opts.buttonLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background-color:#f9fafb;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© Languruu · Kelime öğrenme uygulaması</p>
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
