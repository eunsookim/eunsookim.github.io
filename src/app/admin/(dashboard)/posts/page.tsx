import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";

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

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: posts, count } = await supabase
    .from("posts")
    .select("*, category:categories(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-primary">Posts</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            <span className="text-primary">$</span> posts --list --all
          </p>
        </div>
        <Button render={<Link href="/admin/posts/new" />}>
          <PlusCircle className="size-4" />
          New Post
        </Button>
      </div>

      {/* Post list */}
      {posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} size="sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="font-mono">{post.title}</CardTitle>
                  {post.is_published ? (
                    <Badge variant="default">
                      발행됨
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      임시저장
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  render={<Link href={`/admin/posts/${post.id}/edit`} />}
                >
                  <Pencil className="size-4" />
                </Button>
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
            게시글이 없습니다. 새 글을 작성해보세요.
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
                <Link
                  href={`/admin/posts?page=${currentPage - 1}`}
                />
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
                <Link
                  href={`/admin/posts?page=${currentPage + 1}`}
                />
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
