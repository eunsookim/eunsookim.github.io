import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

import { PostCard } from "@/components/blog/post-card";
import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/lib/types";

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

export default async function Home() {
  const posts = await getLatestPosts();

  return (
    <div className="mx-auto max-w-4xl px-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-24 text-center md:py-32">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 font-mono text-sm text-primary">
          <Terminal className="size-4" />
          <span>~/eunsookim.dev</span>
        </div>

        <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          <span className="text-primary">$</span> hello world_
        </h1>

        <p className="mt-4 max-w-lg font-mono text-lg text-muted-foreground">
          기술에 대한 생각과 의견, 그리고 배움을 기록하는 개발 블로그.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/blog"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Blog 보기
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          >
            Portfolio
          </Link>
        </div>
      </section>

      {/* Latest Posts Section */}
      {posts.length > 0 && (
        <section className="border-t border-border/40 py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-mono text-2xl font-bold text-foreground">
              <span className="text-primary">#</span> 최근 글
            </h2>
            <Link
              href="/blog"
              className="group flex items-center gap-1 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              모든 글 보기
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
