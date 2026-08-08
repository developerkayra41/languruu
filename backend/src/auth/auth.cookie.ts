import { CookieOptions } from "express";

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/auth';

export function refreshCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: REFRESH_COOKIE_PATH,
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}