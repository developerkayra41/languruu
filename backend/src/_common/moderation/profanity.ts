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