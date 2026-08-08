// Küfür filtresi — CAYDIRICI amaçlı, %100 değil. Kendi içeriğinle test edip
// listeyi genişlet/daralt. Kısa/muğlak kökler (ör. "sik", "pic") YANLIŞ ALARM
// yapar (klasik, picture...) — o yüzden uzun/net formlar tercih edildi.
const BANNED = [
    "orospu", "oruspu", "orospucocugu", "kahpe", "pezevenk", "pezeveng",
    "gavat", "ibne", "yavsak", "gotveren", "gotlek", "surtuk",
    "amcik", "siktir", "sikeyim", "sikik", "sikici", "yarrak",
    "sex", "gotveren", "allah", "ataturk", "hz.muhammed", "islam",];

function normalize(text: string): string {
    return text
        .toLocaleLowerCase("tr")
        .replace(/ı/g, "i")
        // leetspeak
        .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
        .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
        .replace(/@/g, "a").replace(/\$/g, "s")
        // ayraçları temizle (a.m.k, a_m_k, "a m k" hepsi birleşir)
        .replace(/[^a-z0-9]/g, "");
}

export function containsProfanity(text: string | undefined | null): boolean {
    if (!text) return false;
    const n = normalize(text);
    return BANNED.some((w) => n.includes(w));
}