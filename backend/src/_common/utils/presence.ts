import { sql } from "drizzle-orm";

export const ONLINE_WINDOW_MINUTES = 5;

export const PRESENCE_VISIBILITY_VALUES = ['off', 'friends', 'everyone'] as const;
export type PresenceVisibility = (typeof PRESENCE_VISIBILITY_VALUES)[number];
export const DEFAULT_PRESENCE_VISIBILITY: PresenceVisibility = 'off';

export const onlineSince = () => sql.raw(`now() - interval '${ONLINE_WINDOW_MINUTES} minutes'`);

export const onlineFlag = (lastSeenColumn: string) =>
    sql.raw(`(${lastSeenColumn} >= now() - interval '${ONLINE_WINDOW_MINUTES} minutes')`);

export interface PresenceViewer {
    id: number;
    is_admin: boolean;
    friend_ids: Set<number>;
}

export interface PresenceSubject {
    user_id: number;
    presence_visibility: string | null;
    online: boolean;
}

export const canSeePresence = (subject: PresenceSubject, viewer: PresenceViewer): boolean => {
    if (!subject.online) return false;
    if (viewer.is_admin) return true;
    const visibility = subject.presence_visibility ?? DEFAULT_PRESENCE_VISIBILITY;
    if (visibility === 'everyone') return true;
    if (visibility === 'friends') {
        return subject.user_id === viewer.id || viewer.friend_ids.has(subject.user_id);
    }
    return false;
};
