import Link from "next/link";
import Image from "next/image";
import type { Lang } from "@/lib/i18n/utils";

interface RelatedPost {
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  cover_image: string | null;
  published_at: string | null;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  lang: Lang;
}

export function RelatedPosts({ posts, lang }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        {lang === "en" ? "Related Posts" : "관련 글"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => {
          const postTitle =
            lang === "en" ? (post.title_en ?? post.title) : post.title;
          const postExcerpt =
            lang === "en" ? (post.excerpt_en ?? post.excerpt) : post.excerpt;

          return (
            <Link
              key={post.slug}
              href={`/${lang}/blog/${post.slug}`}
              className="group rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              {post.cover_image && (
                <div className="relative mb-3 aspect-[2/1] w-full overflow-hidden rounded-md">
                  <Image
                    src={post.cover_image}
                    alt={postTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              )}
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2">
                {postTitle}
              </h3>
              {postExcerpt && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {postExcerpt}
                </p>
              )}
              {post.published_at && (
                <time className="mt-2 block text-xs text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString(
                    lang === "en" ? "en-US" : "ko-KR",
                  )}
                </time>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
