import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/app/i18n/locales";
import { findPost } from "@/app/blog/posts";
import { articleJsonLd } from "@/app/lib/seo";

export default async function BlogPostView({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const post = findPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const Content = post.Content;
  const blogHref = locale === "en" ? "/en/blog" : "/blog";
  const jsonLd = articleJsonLd({
    locale,
    title: post.title,
    description: post.description,
    slug: post.slug,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  });

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href={blogHref} className="text-sm text-gray-500 hover:text-gray-800">
        ← {t("title")}
      </Link>

      <time
        dateTime={post.publishedAt}
        className="block text-xs uppercase tracking-wide text-gray-400 mt-6"
      >
        {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
          new Date(post.publishedAt),
        )}
      </time>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-8">
        {post.title}
      </h1>

      <article>
        <Content />
      </article>

      <div className="mt-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 p-6 text-center text-white">
        <p className="font-semibold text-lg mb-1">{t("ctaTitle")}</p>
        <p className="text-sm text-purple-50 mb-4">{t("ctaText")}</p>
        <Link
          href="/register"
          className="inline-block bg-white text-purple-700 font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition"
        >
          {t("ctaButton")}
        </Link>
      </div>
    </div>
  );
}
