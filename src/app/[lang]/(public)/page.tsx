import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PostCard } from "@/components/blog/post-card";
import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

async function getLatestPosts(): Promise<PostWithRelations[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Failed to fetch posts:", error.message);
      return [];
    }

    return (data ?? []).map((post) => ({
      ...post,
      tags: post.tags ?? [],
    })) as PostWithRelations[];
  } catch {
    // Supabase not connected or env vars missing — return empty
    return [];
  }
}

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  const posts = await getLatestPosts();

  return (
    <div className="mx-auto max-w-4xl px-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-24 text-center md:py-32">
        <p className="mb-4 text-sm font-medium text-primary">{t.hero.tagline}</p>

        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {t.hero.heading}
        </h1>

        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          {t.hero.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {t.hero.blogButton}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={`/${lang}/portfolio`}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          >
            {t.hero.portfolioButton}
          </Link>
        </div>
      </section>

      {/* Latest Posts Section */}
      {posts.length > 0 && (
        <section className="border-t border-border/40 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {t.blog.latestPosts}
            </h2>
            <Link
              href={`/${lang}/blog`}
              className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t.blog.viewAll}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} lang={lang as Lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
