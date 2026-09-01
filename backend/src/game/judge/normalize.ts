const PUNCTUATION = /[.,!?;:¡¿"'`´«»„“”‘’()[\]{}…\-–—/\\|_*~]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

const EXTRA_FOLDS: Record<string, string> = {
    'ı': 'i', 'ß': 'ss', 'ø': 'o', 'ł': 'l', 'đ': 'd', 'ð': 'd',
    'þ': 'th', 'æ': 'ae', 'œ': 'oe', 'å': 'a',
};

const LEADING_ARTICLES: Record<string, string[]> = {
    en: ['to ', 'the ', 'a ', 'an '],
    de: ['der ', 'die ', 'das ', 'ein ', 'eine '],
    es: ['el ', 'la ', 'los ', 'las ', 'un ', 'una '],
    fr: ['le ', 'la ', 'les ', 'un ', 'une '],
    it: ['il ', 'lo ', 'la ', 'i ', 'gli ', 'le ', 'un ', 'una '],
    nl: ['de ', 'het ', 'een '],
    pt: ['o ', 'a ', 'os ', 'as ', 'um ', 'uma '],
};

export function lowerCase(text: string, lang: string): string {
    return text.toLocaleLowerCase(lang || 'en');
}

export function normalizeAnswer(text: string, lang: string): string {
    if (typeof text !== 'string') return '';

    const collapsed = lowerCase(text, lang)
        .replace(PUNCTUATION, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!collapsed) return '';

    const articles = LEADING_ARTICLES[lang] ?? [];
    for (const article of articles) {
        if (collapsed.startsWith(article) && collapsed.length > article.length) {
            return collapsed.slice(article.length);
        }
    }
    return collapsed;
}

export function foldDiacritics(text: string): string {
    let folded = '';
    for (const char of text.normalize('NFD').replace(COMBINING_MARKS, '')) {
        folded += EXTRA_FOLDS[char] ?? char;
    }
    return folded;
}

export function tokenize(text: string): string[] {
    return text.split(/\s+/).filter(Boolean);
}
