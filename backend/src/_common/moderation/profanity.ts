const BANNED = [
    "orospu", "oruspu", "orospucocugu", "kahpe", "pezevenk", "pezeveng",
    "gavat", "ibne", "yavsak", "gotveren", "gotlek", "surtuk",
    "amcik", "siktir", "sikeyim", "sikik", "sikici", "yarrak",
    "sex", "gotveren", "allah", "ataturk", "hz.muhammed", "islam",];

function normalize(text: string): string {
    return text
        .toLocaleLowerCase("tr")
        .replace(/ı/g, "i")
        .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
        .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
        .replace(/@/g, "a").replace(/\$/g, "s")
        .replace(/[^a-z0-9]/g, "");
}

export function containsProfanity(text: string | undefined | null): boolean {
    if (!text) return false;
    const n = normalize(text);
    return BANNED.some((w) => n.includes(w));
}

const LEET: Record<string, string> = {
    "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "9": "g",
    "@": "a", "$": "s",
};

const LETTERS = "a-zçğıöşü";
const MAX_SUFFIX = 10;

const TEXT_EXACT = new Set([
    "amk", "amq", "aq", "awk", "oç", "oc",
    "göt", "götü", "götün", "götüm", "götüne", "götünü", "götler", "götlek",
    "ass", "asses", "cock", "cocks", "dick", "dicks",
]);

const TEXT_STEMS = [
    "sik", "amcık", "amcik", "amına", "amina",
    "orospu", "oruspu", "kahpe", "kaltak", "sürtük",
    "piç", "puşt", "ibne", "yavşak", "gavat", "pezevenk", "şerefsiz",
    "yarra", "yarak", "dalyarak", "taşak", "taşşak", "çük",
    "götver", "gotver",
    "fuck", "fuk", "shit", "bitch", "cunt", "whore", "slut", "bastard",
    "asshole", "motherfuck", "nigger", "nigga", "faggot", "wanker",
    "bollocks", "twat", "pussy", "porn",
];

const TEXT_ALLOW = new Set(["sikke", "sikkeler", "sikkesi", "sikkeyi", "sikkenin"]);

function normalizeText(text: string): string {
    return text
        .toLocaleLowerCase("tr")
        .split("")
        .map((ch) => LEET[ch] ?? ch)
        .join("")
        .replace(new RegExp(`[^${LETTERS}]+`, "g"), " ")
        .replace(/(.)\1{2,}/g, "$1")
        .trim()
        .replace(/\s+/g, " ");
}

function withJoinedRuns(tokens: string[]): string[] {
    const joined: string[] = [];
    let run: string[] = [];

    for (const token of [...tokens, "--"]) {
        if (token.length === 1) {
            run.push(token);
            continue;
        }
        if (run.length > 1) joined.push(run.join(""));
        run = [];
    }
    return [...tokens, ...joined];
}

export function containsProfanityInText(text: string | undefined | null): boolean {
    if (!text) return false;
    return withJoinedRuns(normalizeText(text).split(" ").filter(Boolean))
        .some((token) => {
            if (TEXT_ALLOW.has(token)) return false;
            if (TEXT_EXACT.has(token)) return true;
            return TEXT_STEMS.some(
                (stem) => token.startsWith(stem) && token.length - stem.length <= MAX_SUFFIX,
            );
        });
}