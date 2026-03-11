"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import type { Post, Series } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SeriesNavProps {
  series: Series;
  posts: Post[];
  currentPostId: string;
}

export function SeriesNav({ series, posts, currentPostId }: SeriesNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentIndex = posts.findIndex((p) => p.id === currentPostId);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <nav className="rounded-lg border border-border bg-card p-4">
      {/* Series header - clickable to toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-xs font-medium text-muted-foreground">시리즈</p>
          <h3 className="font-mono text-sm font-semibold text-primary">
            {series.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {currentIndex + 1} / {posts.length}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible post list */}
      {isOpen && (
        <ol className="mt-3 space-y-1 border-t border-border pt-3">
          {posts.map((post, idx) => {
            const isCurrent = post.id === currentPostId;
            return (
              <li key={post.id}>
                {isCurrent ? (
                  <span
                    className={cn(
                      "flex items-baseline gap-2 rounded px-2 py-1 text-sm",
                      "bg-primary/10 font-medium text-primary",
                    )}
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {idx + 1}.
                    </span>
                    {post.title}
                  </span>
                ) : (
                  <Link
                    href={`/blog/${post.slug}`}
                    className={cn(
                      "flex items-baseline gap-2 rounded px-2 py-1 text-sm",
                      "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="shrink-0 font-mono text-xs">
                      {idx + 1}.
                    </span>
                    {post.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Prev / Next links */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        {prevPost ? (
          <Link
            href={`/blog/${prevPost.slug}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="line-clamp-1">이전글</span>
          </Link>
        ) : (
          <span />
        )}
        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <span className="line-clamp-1">다음글</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
