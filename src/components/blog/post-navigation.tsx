import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Lang } from "@/lib/i18n/utils";

interface NavPost {
  slug: string;
  title: string;
  title_en: string | null;
  published_at: string | null;
}

interface PostNavigationProps {
  prevPost: NavPost | null;
  nextPost: NavPost | null;
  lang: Lang;
}

export function PostNavigation({ prevPost, nextPost, lang }: PostNavigationProps) {
  if (!prevPost && !nextPost) return null;

  return (
    <nav className="grid grid-cols-2 gap-4">
      {prevPost ? (
        <Link
          href={`/${lang}/blog/${prevPost.slug}`}
          className="group flex flex-col rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="size-3" />
            {lang === "en" ? "Previous" : "이전 글"}
          </span>
          <span className="mt-1 text-sm font-medium text-foreground group-hover:text-primary line-clamp-2">
            {lang === "en" ? (prevPost.title_en ?? prevPost.title) : prevPost.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {nextPost ? (
        <Link
          href={`/${lang}/blog/${nextPost.slug}`}
          className="group flex flex-col items-end rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {lang === "en" ? "Next" : "다음 글"}
            <ChevronRight className="size-3" />
          </span>
          <span className="mt-1 text-sm font-medium text-foreground group-hover:text-primary line-clamp-2">
            {lang === "en" ? (nextPost.title_en ?? nextPost.title) : nextPost.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
