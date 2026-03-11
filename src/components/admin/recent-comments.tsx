"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  post_id: string;
  posts: { title: string; slug: string } | null;
}

interface AdminRecentCommentsProps {
  comments: RecentComment[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminRecentComments({ comments: initialComments }: AdminRecentCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;

    setDeletingId(commentId);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "댓글 삭제에 실패했습니다.");
        return;
      }

      toast.success("댓글이 삭제되었습니다.");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          아직 댓글이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-foreground">
                  {comment.author_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(comment.created_at)}
                </span>
              </div>

              <p className="mt-0.5 text-sm text-foreground/80">
                {truncate(comment.content, 100)}
              </p>

              {comment.posts && (
                <Link
                  href={`/blog/${comment.posts.slug}`}
                  className="mt-1 inline-block text-xs text-muted-foreground hover:text-primary"
                >
                  {truncate(comment.posts.title, 50)}
                </Link>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              disabled={deletingId === comment.id}
              onClick={() => handleDelete(comment.id)}
            >
              {deletingId === comment.id ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
