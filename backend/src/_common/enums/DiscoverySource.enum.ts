export enum DiscoverySource {
    FRIEND = 'friend',
    AI = 'ai',
    ADS = 'ads',
    YOUTUBE_COMMENT = 'youtube_comment',
    SOCIAL_MEDIA = 'social_media',
    SEARCH_ENGINE = 'search_engine',
    OTHER = 'other',
    SKIPPED = 'skipped',
}

export const DISCOVERY_SOURCES = Object.values(DiscoverySource);
