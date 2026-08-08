import { registerAs } from "@nestjs/config";

export default registerAs('mail', () => ({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
    APP_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    ALERT_EMAIL: process.env.ALERT_EMAIL
}))