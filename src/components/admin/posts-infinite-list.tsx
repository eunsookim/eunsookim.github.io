"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PostItem {
  id: string;
  title: string;
  status: "draft" | "pending_review" | "published" | "scheduled";
  generated_by: "human" | "ai" | null;
  created_at: string;
  published_at: string | null;
  category: { name: string } | null;
}

interface PostsInfiniteListProps {
  initialPosts: PostItem[];
  initialHasMore: boolean;
  activeTab: string;
}

export function PostsInfiniteList({
  initialPosts,
  initialHasMore,
  activeTab,
}: PostsInfiniteListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage) });
    if (activeTab === "ai") params.set("tab", "ai");

    try {
      const res = await fetch(`/api/admin/posts?${params}`);
      const data = await res.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, activeTab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
          {activeTab === "ai"
            ? "검토 대기 중인 AI 초안이 없습니다."
            : "게시글이 없습니다. 새 글을 작성해보세요."}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id} size="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="font-mono">{post.title}</CardTitle>
                {post.generated_by === "ai" && (
                  <Badge className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    AI 생성
                  </Badge>
                )}
                {post.status === "published" ? (
                  <Badge variant="default">발행됨</Badge>
                ) : post.status === "pending_review" ? (
                  <Badge variant="outline">검토 대기</Badge>
                ) : post.status === "scheduled" ? (
                  <Badge variant="secondary">예약됨</Badge>
                ) : (
                  <Badge variant="secondary">임시저장</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {activeTab === "ai" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={
                        <Link
                          href={`/admin/posts/${post.id}/edit?action=publish`}
                        />
                      }
                      title="발행"
                    >
                      <Send className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={
                        <Link
                          href={`/admin/posts/${post.id}/edit?action=delete`}
                        />
                      }
                      title="삭제"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  render={<Link href={`/admin/posts/${post.id}/edit`} />}
                  title="편집"
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                {post.category && <span>{post.category.name}</span>}
                <span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("ko-KR")
                    : new Date(post.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </>
  );
}
