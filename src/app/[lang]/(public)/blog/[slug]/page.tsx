import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import PostContent from "@/components/blog/post-content";
import { SeriesNav } from "@/components/blog/series-nav";
import { CommentSection } from "@/components/blog/comment-section";
import { createClient } from "@/lib/supabase/server";
import type { Post, PostWithRelations } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";

interface BlogPostPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

async function getPost(slug: string) {
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, category:categories(*), series:series(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return post as PostWithRelations | null;
}

async function getSeriesPosts(seriesId: string): Promise<Post[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("series_id", seriesId)
    .eq("is_published", true)
    .order("series_order", { ascending: true });

  return (posts ?? []) as Post[];
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: lang === "en" ? "Post not found" : "글을 찾을 수 없습니다" };
  }

  const title = lang === "en" ? (post.title_en ?? post.title) : post.title;
  const excerpt = lang === "en" ? (post.excerpt_en ?? post.excerpt) : post.excerpt;

  return {
    title,
    description: excerpt ?? undefined,
    openGraph: {
      title,
      description: excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const title = lang === "en" ? (post.title_en ?? post.title) : post.title;
  const content = lang === "en" ? (post.content_en ?? post.content) : post.content;
  const dateLocale = lang === "en" ? "en-US" : "ko-KR";

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const categoryName = post.category
    ? lang === "en"
      ? (post.category.name_en ?? post.category.name)
      : post.category.name
    : null;

  // Fetch series posts if the post belongs to a series
  const seriesPosts =
    post.series_id && post.series ? await getSeriesPosts(post.series_id) : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* Back link */}
      <Link
        href={`/${lang}/blog`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <span>&larr;</span>
        <span>{lang === "en" ? "Back to blog" : "블로그 목록"}</span>
      </Link>

      {/* Cover image */}
      {post.cover_image && (
        <div className="relative mb-8 aspect-[2/1] w-full overflow-hidden rounded-lg border border-border">
          <Image
            src={post.cover_image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-mono text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {formattedDate && (
            <time dateTime={post.published_at!}>{formattedDate}</time>
          )}

          {post.category && (
            <Link href={`/${lang}/blog?category=${post.category.slug}`}>
              <Badge
                variant="secondary"
                className="text-xs"
                style={
                  post.category.color
                    ? {
                        backgroundColor: `${post.category.color}20`,
                        color: post.category.color,
                        borderColor: `${post.category.color}40`,
                      }
                    : undefined
                }
              >
                {categoryName}
              </Badge>
            </Link>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/${lang}/blog?tag=${tag}`}>
                <Badge variant="outline" className="text-xs">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Series navigation (top) */}
      {post.series && seriesPosts && seriesPosts.length > 1 && (
        <div className="mb-8">
          <SeriesNav
            series={post.series}
            posts={seriesPosts}
            currentPostId={post.id}
            lang={lang as Lang}
          />
        </div>
      )}

      {/* Post content */}
      {content && <PostContent content={content} />}

      {/* Series navigation (bottom) */}
      {post.series && seriesPosts && seriesPosts.length > 1 && (
        <div className="mt-10">
          <SeriesNav
            series={post.series}
            posts={seriesPosts}
            currentPostId={post.id}
            lang={lang as Lang}
          />
        </div>
      )}

      {/* Divider */}
      <hr className="my-10 border-border" />

      {/* Comments */}
      <CommentSection postId={post.id} lang={lang as Lang} />
    </article>
  );
}
