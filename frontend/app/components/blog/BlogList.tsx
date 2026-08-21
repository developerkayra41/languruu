import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/app/i18n/locales";
import { postsFor } from "@/app/blog/posts";

export default async function BlogList({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = postsFor(locale);
  const home = locale === "en" ? "/en" : "/";

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <Link href={home} className="text-sm text-gray-500 hover:text-gray-800">
        ← Languruu
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-6 mb-2">
        {t("title")}
      </h1>
      <p className="text-gray-600 mb-10">{t("subtitle")}</p>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b border-gray-100 pb-8">
            <time
              dateTime={post.publishedAt}
              className="text-xs uppercase tracking-wide text-gray-400"
            >
              {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                new Date(post.publishedAt),
              )}
            </time>
            <h2 className="text-xl font-semibold text-gray-900 mt-2 mb-2">
              <Link
                href={`${locale === "en" ? "/en" : ""}/blog/${post.slug}`}
                className="hover:text-purple-700"
              >
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 leading-7">{post.description}</p>
            <Link
              href={`${locale === "en" ? "/en" : ""}/blog/${post.slug}`}
              className="inline-block mt-3 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              {t("readMore")} →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
