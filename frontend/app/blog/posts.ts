import type { ComponentType } from "react";
import type { Locale } from "@/app/i18n/locales";

import TrKelimeEzberlemeTeknikleri from "@/content/blog/tr/kelime-ezberleme-teknikleri.mdx";
import EnHowToMemorizeVocabulary from "@/content/blog/en/how-to-memorize-vocabulary.mdx";

export interface BlogPost {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  Content: ComponentType;
}

export const POSTS: BlogPost[] = [
  {
    slug: "kelime-ezberleme-teknikleri",
    locale: "tr",
    title: "Kelime ezberleme teknikleri: kalıcı öğrenmenin 5 yolu",
    description:
      "Aralıklı tekrar, aktif hatırlama ve bağlamla öğrenme. Yabancı kelimeleri unutmadan öğrenmenin araştırmayla desteklenen yöntemleri.",
    publishedAt: "2026-08-21",
    Content: TrKelimeEzberlemeTeknikleri,
  },
  {
    slug: "how-to-memorize-vocabulary",
    locale: "en",
    title: "How to memorize vocabulary: 5 techniques that actually work",
    description:
      "Spaced repetition, active recall and learning in context. Research-backed ways to learn foreign words without forgetting them.",
    publishedAt: "2026-08-21",
    Content: EnHowToMemorizeVocabulary,
  },
];

export function postsFor(locale: Locale): BlogPost[] {
  return POSTS.filter((post) => post.locale === locale).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function findPost(locale: Locale, slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.locale === locale && post.slug === slug);
}
