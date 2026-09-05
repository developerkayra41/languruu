import { ConfigService } from "@nestjs/config";

export const isAdminEmail = (config: ConfigService, email?: string | null): boolean => {
    if (!email) return false;
    const admins = (config.get<string>('app.ADMIN_EMAILS') ?? '')
        .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    return admins.includes(email.toLowerCase());
};
