const GOOGLE_AVATAR_HOST = "googleusercontent.com";
const GOOGLE_HI_RES_SIZE = 512;

export function hiResAvatarUrl(url: string): string {
    if (!url.includes(GOOGLE_AVATAR_HOST)) return url;
    return url.replace(/=s\d+(-c)?$/, `=s${GOOGLE_HI_RES_SIZE}$1`);
}
