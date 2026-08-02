import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { getAllBlogPosts } from "@/lib/blog";
import type { Locale } from "@/i18n/config";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing.blog");
  const posts = await getAllBlogPosts(locale);

  return (
    <div className="relative min-h-screen">
      <LandingNav />

      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-success">
              {t("sectionLabel")}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-[6px] border border-border bg-card transition-all hover:border-[#333333]"
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-muted">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="text-base font-semibold leading-snug">
                    {post.title}
                  </h2>
                  <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{post.date}</time>
                    <span>&middot;</span>
                    <span>
                      {post.readTime} {t("minRead")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
