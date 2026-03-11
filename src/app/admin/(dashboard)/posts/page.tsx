import Link from "next/link";
import { PlusCircle, Pencil, Trash2, Send } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PAGE_SIZE = 20;

const TABS = [
  { key: "all", label: "전체 글", href: "/admin/posts" },
  { key: "ai", label: "AI 초안", href: "/admin/posts?tab=ai" },
] as const;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const { page: pageParam, tab } = await searchParams;
  const activeTab = tab === "ai" ? "ai" : "all";
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, category:categories(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (activeTab === "ai") {
    query = query.eq("status", "pending_review");
  }

  const { data: posts, count } = await query.range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const paginationHref = (page: number) => {
    const params = new URLSearchParams();
    if (activeTab === "ai") params.set("tab", "ai");
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/admin/posts${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-primary">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">글 목록 관리</p>
        </div>
        <Button render={<Link href="/admin/posts/new" />}>
          <PlusCircle className="size-4" />
          New Post
        </Button>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              activeTab === t.key
                ? "border-b-2 border-primary font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Post list */}
      {posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} size="sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="font-mono">{post.title}</CardTitle>
                  {post.generated_by === "ai" && (
                    <Badge
                      className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    >
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
                          <Link href={`/admin/posts/${post.id}/edit?action=publish`} />
                        }
                        title="발행"
                      >
                        <Send className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={
                          <Link href={`/admin/posts/${post.id}/edit?action=delete`} />
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
                  {post.category && (
                    <span>
                      {(post.category as { name: string }).name}
                    </span>
                  )}
                  <span>
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
            {activeTab === "ai"
              ? "검토 대기 중인 AI 초안이 없습니다."
              : "게시글이 없습니다. 새 글을 작성해보세요."}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={paginationHref(currentPage - 1)} />
              }
            >
              이전
            </Button>
          )}
          <span className="font-mono text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={paginationHref(currentPage + 1)} />
              }
            >
              다음
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
