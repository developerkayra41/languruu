import { Request } from 'express';

/** İstekten IP ve user-agent çıkarır. security_events alan adlarıyla (snake_case) uyumludur. */
export function clientInfo(req: Request): { ip_address: string; user_agent: string } {
    const user_agent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown';
    const ip_address = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? req.ip ?? 'unknown';
    return { ip_address, user_agent };
}