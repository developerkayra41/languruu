import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.languruu.com"),
  title: {
    default: "Languruu — Yabancı kelime öğrenme uygulaması",
    template: "%s | Languruu",
  },
  description:
    "Languruu ile yabancı dil kelimelerini kolayca öğren: kendi kelime gruplarını oluştur, çalış, marketplace'ten hazır setleri kullan. Learn foreign words with flashcards and daily practice.",
  applicationName: "Languruu",
  authors: [{ name: "Languruu" }],
  openGraph: {
    type: "website",
    siteName: "Languruu",
    url: "https://www.languruu.com",
    title: "Languruu — Yabancı kelime öğrenme uygulaması",
    description:
      "Kelime gruplarını oluştur, çalış, paylaş. Learn foreign words the easy way.",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Languruu — Yabancı kelime öğren",
    description: "Yabancı dil kelimelerini kolayca öğren ve pratik yap.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "";
  return (
    <html lang={locale} className={theme}>
      <head>
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={spaceGrotesk.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
