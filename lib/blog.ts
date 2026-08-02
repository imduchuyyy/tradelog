import "server-only";
import matter from "gray-matter";
import { defaultLocale, type Locale } from "@/i18n/config";

const BLOG_REPO_RAW_BASE =
  "https://raw.githubusercontent.com/imduchuyyy/zennotes-blog/main";

export type BlogPostMeta = {
  slug: string;
  title: string;
  categories: string[];
  date: string;
  readTime: number;
  coverImage: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

async function fetchRaw(pathname: string): Promise<string | null> {
  const res = await fetch(`${BLOG_REPO_RAW_BASE}/${pathname}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.text();
}

async function getRegistrySlugs(): Promise<string[]> {
  const raw = await fetchRaw("registry.json");
  if (!raw) {
    return [];
  }

  const { posts } = JSON.parse(raw) as { posts: string[] };
  return posts;
}

async function readPost(slug: string, locale: Locale): Promise<BlogPost | null> {
  let raw = await fetchRaw(`${locale}/${slug}.md`);
  if (!raw && locale !== defaultLocale) {
    raw = await fetchRaw(`${defaultLocale}/${slug}.md`);
  }

  if (!raw) {
    return null;
  }

  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title,
    categories: data.categories ?? [],
    date: data.date,
    readTime: data.readTime,
    coverImage: data.coverImage,
    content,
  };
}

export async function getAllBlogPosts(locale: Locale): Promise<BlogPostMeta[]> {
  const slugs = await getRegistrySlugs();
  const posts = await Promise.all(slugs.map((slug) => readPost(slug, locale)));

  return posts
    .filter((post): post is BlogPost => post !== null)
    .map(({ slug, title, categories, date, readTime, coverImage }) => ({
      slug,
      title,
      categories,
      date,
      readTime,
      coverImage,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getBlogPost(
  slug: string,
  locale: Locale
): Promise<BlogPost | null> {
  const slugs = await getRegistrySlugs();
  if (!slugs.includes(slug)) {
    return null;
  }

  return readPost(slug, locale);
}
