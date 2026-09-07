export const AVATAR_BUCKET = 'avatars';

const isStoredAvatar = (url: string): boolean => url.includes(`/${AVATAR_BUCKET}/`);

export const stripAvatarVersion = (url: string): string => url.split('?')[0];

export const stampAvatarVersion = (url: string, version: number = Date.now()): string =>
    isStoredAvatar(url) ? `${stripAvatarVersion(url)}?v=${version}` : url;

export const withAvatarVersion = (
    url: string | null | undefined,
    updatedAt?: Date | null,
): string | undefined => {
    if (!url) return undefined;
    if (!isStoredAvatar(url) || url.includes('?')) return url;
    return `${url}?v=${updatedAt?.getTime() ?? Date.now()}`;
};
