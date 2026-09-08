import { createHmac, timingSafeEqual } from 'crypto';

const sign = (payload: string, secret: string): string =>
    createHmac('sha256', secret).update(payload).digest('base64url').slice(0, 32);

export const buildUnsubscribeToken = (userId: number, secret: string): string =>
    `${userId}.${sign(String(userId), secret)}`;

export const parseUnsubscribeToken = (token: string, secret: string): number | null => {
    const [rawId, signature] = (token ?? '').split('.');
    const userId = Number(rawId);
    if (!Number.isInteger(userId) || userId <= 0 || !signature) return null;

    const expected = Buffer.from(sign(rawId, secret));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

    return userId;
};
