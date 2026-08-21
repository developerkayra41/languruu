import type { Metadata } from "next";
import BlogPostView from "@/app/components/blog/BlogPostView";
import { findPost, postsFor } from "@/app/blog/posts";
import { blogPostUrl } from "@/app/lib/seo";

export function generateStaticParams() {
  return postsFor("en").map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost("en", slug);
  if (!post) return {};

  return {
    title: { absolute: `${post.title} | Languruu` },
    description: post.description,
    alternates: { canonical: blogPostUrl("en", post.slug) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      locale: "en_US",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function EnglishBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostView locale="en" slug={slug} />;
}
