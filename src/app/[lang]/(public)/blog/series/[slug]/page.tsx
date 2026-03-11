import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import type { Post, Series } from "@/lib/types";

interface SeriesPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

async function getSeries(slug: string): Promise<Series | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("series")
    .select("*")
    .eq("slug", slug)
    .single();

  return data as Series | null;
}

async function getSeriesPosts(seriesId: string): Promise<Post[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("series_id", seriesId)
    .eq("is_published", true)
    .order("series_order", { ascending: true });

  return (data ?? []) as Post[];
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const series = await getSeries(slug);

  if (!series) {
    return { title: lang === "en" ? "Series not found" : "시리즈를 찾을 수 없습니다" };
  }

  const title = lang === "en" ? (series.title_en ?? series.title) : series.title;
  const description = lang === "en" ? (series.description_en ?? series.description) : series.description;
  const seriesLabel = lang === "en" ? "Series" : "시리즈";

  return {
    title: `${title} — ${seriesLabel}`,
    description: description ?? undefined,
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { lang, slug } = await params;
  const series = await getSeries(slug);

  if (!series) {
    notFound();
  }

  const posts = await getSeriesPosts(series.id);

  const seriesTitle = lang === "en" ? (series.title_en ?? series.title) : series.title;
  const seriesDescription = lang === "en" ? (series.description_en ?? series.description) : series.description;
  const dateLocale = lang === "en" ? "en-US" : "ko-KR";
  const seriesLabel = lang === "en" ? "Series" : "시리즈";
  const totalPostsLabel =
    lang === "en"
      ? `${posts.length} post${posts.length !== 1 ? "s" : ""} total`
      : `총 ${posts.length}개의 글`;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      {/* Back link */}
      <Link
        href={`/${lang}/blog`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <span>&larr;</span>
        <span>{lang === "en" ? "Back to blog" : "블로그 목록"}</span>
      </Link>

      {/* Series heading */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted-foreground">{seriesLabel}</p>
        <h1 className="text-3xl font-bold text-foreground">{seriesTitle}</h1>
        {seriesDescription && (
          <p className="mt-2 text-sm text-muted-foreground">
            {seriesDescription}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {totalPostsLabel}
        </p>
      </div>

      {/* Ordered post list */}
      {posts.length > 0 ? (
        <ol className="space-y-4">
          {posts.map((post) => {
            const postTitle = lang === "en" ? (post.title_en ?? post.title) : post.title;
            const formattedDate = post.published_at
              ? new Date(post.published_at).toLocaleDateString(dateLocale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : null;

            return (
              <li key={post.id}>
                <Link
                  href={`/${lang}/blog/${post.slug}`}
                  className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  {/* Order number */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-sm font-bold text-primary">
                    {post.series_order ?? "-"}
                  </span>

                  {/* Post info */}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-mono text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                      {postTitle}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                    {formattedDate && (
                      <time
                        dateTime={post.published_at!}
                        className="mt-2 block text-xs text-muted-foreground"
                      >
                        {formattedDate}
                      </time>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="py-20 text-center">
          <p className="font-mono text-muted-foreground">
            <span className="text-primary">$</span> echo &quot;{lang === "en" ? "No posts in this series." : "이 시리즈에 게시글이 없습니다"}&quot;
          </p>
        </div>
      )}
    </section>
  );
}
