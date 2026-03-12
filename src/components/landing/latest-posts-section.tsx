"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { SectionFadeIn } from "./section-fade-in";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PostWithRelations } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";

interface LatestPostsSectionProps {
  lang: Lang;
  posts: PostWithRelations[];
  t: {
    latestPosts: string;
    viewAllPosts: string;
  };
}

function PostCard({
  post,
  lang,
  index,
}: {
  post: PostWithRelations;
  lang: Lang;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  const title = lang === "en" ? (post.title_en ?? post.title) : post.title;
  const categoryName = post.category
    ? lang === "en"
      ? (post.category.name_en ?? post.category.name)
      : post.category.name
    : null;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(
        lang === "en" ? "en-US" : "ko-KR",
        { year: "numeric", month: "short", day: "numeric" },
      )
    : null;

  // Estimate reading time
  const content = lang === "en" ? (post.content_en ?? post.content) : post.content;
  const wordCount = content ? content.split(/\s+/).length : 0;
  const readingMin = Math.max(1, Math.ceil(wordCount / (lang === "en" ? 250 : 200)));
  const readingTime = lang === "en" ? `${readingMin} min read` : `${readingMin}분`;

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: reduced ? 0 : index * 0.1 }}
    >
      <Link
        href={`/${lang}/blog/${post.slug}`}
        className="group block h-full"
      >
        <div className="glass-card flex h-full flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:glow-primary-sm">
          {/* Cover image */}
          {post.cover_image && (
            <div className="relative aspect-[2/1] w-full overflow-hidden">
              <Image
                src={post.cover_image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col p-5">
            {/* Category badge */}
            {categoryName && (
              <Badge
                variant="secondary"
                className="mb-3 w-fit text-xs"
                style={
                  post.category?.color
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
            )}

            {/* Title */}
            <h3 className="line-clamp-2 font-bold text-foreground transition-colors group-hover:text-primary">
              {title}
              <ArrowRight className="ml-1 inline-block size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </h3>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Date + reading time */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              {formattedDate && (
                <time dateTime={post.published_at!}>
                  {formattedDate}
                </time>
              )}
              {formattedDate && <span>·</span>}
              <span>{readingTime}</span>
            </div>
          </div>

          {/* Dark mode only: glow underline */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 dark:group-hover:opacity-100" />
        </div>
      </Link>
    </motion.div>
  );
}

export function LatestPostsSection({
  lang,
  posts,
  t,
}: LatestPostsSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4">
        <SectionFadeIn>
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {t.latestPosts}
            </h2>
            <Link
              href={`/${lang}/blog`}
              className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t.viewAllPosts}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </SectionFadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} lang={lang} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
