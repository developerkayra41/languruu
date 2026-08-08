export interface Language {
    code: string;      // ISO 639-1, küçük harf (dil kodu — languages kolonuna bu yazılır)
    label: string;      // Türkçe görünen ad
    flagCode: string;   // ISO 3166-1 ülke kodu (bayrak için, dil koduyla HER ZAMAN aynı değil)
}

export const LANGUAGES: Language[] = [
    { code: "en", label: "İngilizce", flagCode: "gb" },
    { code: "tr", label: "Türkçe", flagCode: "tr" },
    { code: "de", label: "Almanca", flagCode: "de" },
    { code: "fr", label: "Fransızca", flagCode: "fr" },
    { code: "es", label: "İspanyolca", flagCode: "es" },
    { code: "it", label: "İtalyanca", flagCode: "it" },
    { code: "ru", label: "Rusça", flagCode: "ru" },
    { code: "ar", label: "Arapça", flagCode: "sa" },
    { code: "zh", label: "Çince", flagCode: "cn" },
    { code: "ja", label: "Japonca", flagCode: "jp" },
    { code: "ko", label: "Korece", flagCode: "kr" },
    { code: "pt", label: "Portekizce", flagCode: "pt" },
    { code: "nl", label: "Hollandaca", flagCode: "nl" },
];