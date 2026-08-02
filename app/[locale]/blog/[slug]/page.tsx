import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { BlogMarkdownContent } from "@/components/blog/markdown-content";
import { getBlogPost } from "@/lib/blog";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.title,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing.blog");
  const post = await getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      <LandingNav />

      <article className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={post.date}>{post.date}</time>
            <span>&middot;</span>
            <span>
              {post.readTime} {t("minRead")}
            </span>
          </div>

          <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-[6px] border border-border bg-muted">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="prose-blog mt-10">
            <BlogMarkdownContent content={post.content} />
          </div>
        </div>
      </article>

      <LandingFooter />
    </div>
  );
}
