const LANG_TO_BCP: Record<string, string> = {
  en: "en-GB", tr: "tr-TR", de: "de-DE", fr: "fr-FR", es: "es-ES",
  it: "it-IT", ru: "ru-RU", ar: "ar-SA", zh: "zh-CN", ja: "ja-JP",
  ko: "ko-KR", pt: "pt-PT", nl: "nl-NL",
};

export function speak(text: string, langCode?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const bcp = (langCode && LANG_TO_BCP[langCode]) || langCode || "";
  const u = new SpeechSynthesisUtterance(text);
  if (bcp) u.lang = bcp;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length && bcp) {
    const base = bcp.split("-")[0];
    const voice =
      voices.find((v) => v.lang === bcp) ??
      voices.find((v) => v.lang.startsWith(base));
    if (voice) u.voice = voice;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
