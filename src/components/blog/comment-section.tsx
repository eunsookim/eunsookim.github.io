"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, MessageSquareIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Comment, CommentWithReplies } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

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

const CONTENT_MAX = 1000;

// ---------------------------------------------------------------------------
// CommentForm
// ---------------------------------------------------------------------------

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
  lang: Lang;
}

function CommentForm({ postId, parentId, onSuccess, onCancel, lang }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = getMessages(lang);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Read honeypot from form data
    const formData = new FormData(e.currentTarget);
    const website = formData.get("website") as string;

    if (!authorName.trim() || !password || !content.trim()) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    if (password.length < 4) {
      toast.error("비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    if (content.length > CONTENT_MAX) {
      toast.error(`내용은 ${CONTENT_MAX}자 이하로 입력해주세요.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId ?? null,
          author_name: authorName.trim(),
          password,
          content: content.trim(),
          website,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "댓글 작성에 실패했습니다.");
        return;
      }

      toast.success("댓글이 작성되었습니다.");
      setAuthorName("");
      setPassword("");
      setContent("");
      onSuccess();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${parentId ?? "root"}`}>{t.comment.name}</Label>
          <Input
            id={`name-${parentId ?? "root"}`}
            placeholder={t.comment.name}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={50}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pw-${parentId ?? "root"}`}>{t.comment.password}</Label>
          <Input
            id={`pw-${parentId ?? "root"}`}
            type="password"
            placeholder={t.comment.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            required
          />
        </div>
      </div>

      {/* Honeypot field – hidden from humans */}
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        aria-hidden="true"
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`content-${parentId ?? "root"}`}>{t.comment.content}</Label>
          <span className="text-xs text-muted-foreground">
            {content.length}/{CONTENT_MAX}
          </span>
        </div>
        <Textarea
          id={`content-${parentId ?? "root"}`}
          placeholder="댓글을 입력해주세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={CONTENT_MAX}
          rows={3}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting} size="sm">
          {submitting && <Loader2Icon className="size-3.5 animate-spin" />}
          {parentId ? t.comment.replyTo : t.comment.submit}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t.comment.cancelButton}
          </Button>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// CommentItem
// ---------------------------------------------------------------------------

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onReplyClick?: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  lang: Lang;
}

function CommentItem({ comment, isReply, onReplyClick, onDelete, lang }: CommentItemProps) {
  const t = getMessages(lang);

  return (
    <div
      className={
        isReply
          ? "ml-4 border-l-2 border-primary/20 pl-4 sm:ml-6 sm:pl-6"
          : ""
      }
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {comment.author_name}
        </span>
        <span className="text-xs text-muted-foreground">
          {getRelativeTime(comment.created_at)}
        </span>
      </div>

      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
        {comment.content}
      </p>

      <div className="mt-2 flex items-center gap-1">
        {!isReply && onReplyClick && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onReplyClick(comment.id)}
            className="text-muted-foreground hover:text-primary"
          >
            <MessageSquareIcon className="size-3" />
            {t.comment.reply}
          </Button>
        )}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onDelete(comment.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-3" />
          {t.comment.delete}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteDialog
// ---------------------------------------------------------------------------

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
  lang: Lang;
}

function DeleteDialog({ open, onOpenChange, onConfirm, lang }: DeleteDialogProps) {
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = getMessages(lang);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPassword("");
      setDeleting(false);
      // Focus input after dialog animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!password) {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }
    setDeleting(true);
    try {
      await onConfirm(password);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.comment.title}</DialogTitle>
          <DialogDescription>
            {t.comment.deleteConfirm}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 px-0">
          <Label htmlFor="delete-password">{t.comment.password}</Label>
          <Input
            ref={inputRef}
            id="delete-password"
            type="password"
            placeholder={t.comment.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting && <Loader2Icon className="size-3.5 animate-spin" />}
            {t.comment.deleteButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// CommentSection (main export)
// ---------------------------------------------------------------------------

interface CommentSectionProps {
  postId: string;
  lang: Lang;
}

export function CommentSection({ postId, lang }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const t = getMessages(lang);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const deleteDialogOpen = deleteTarget !== null;

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (res.ok) {
        const data: CommentWithReplies[] = await res.json();
        setComments(data);
      }
    } catch {
      // silent fail – comments are non-critical
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handlers
  const handleCommentSuccess = () => {
    setReplyTo(null);
    fetchComments();
  };

  const handleReplyClick = (commentId: string) => {
    setReplyTo((prev) => (prev === commentId ? null : commentId));
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/comments/${deleteTarget}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          toast.error("비밀번호가 올바르지 않습니다.");
        } else {
          toast.error(data.error ?? "댓글 삭제에 실패했습니다.");
        }
        return;
      }

      toast.success("댓글이 삭제되었습니다.");
      setDeleteTarget(null);
      fetchComments();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  };

  // Total comment count including replies
  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + c.replies.length,
    0,
  );

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-foreground">
        {t.comment.title} {totalCount > 0 && <span className="text-primary">({totalCount})</span>}
      </h2>

      <Separator className="my-4" />

      {/* Comment form */}
      <div className="rounded-lg border border-border bg-card p-4">
        <CommentForm postId={postId} onSuccess={handleCommentSuccess} lang={lang} />
      </div>

      {/* Comment list */}
      <div className="mt-6 space-y-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
            <span className="ml-2 text-sm">댓글을 불러오는 중...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t.comment.noComments}
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id}>
              {index > 0 && <Separator className="my-4" />}

              {/* Top-level comment */}
              <CommentItem
                comment={comment}
                onReplyClick={handleReplyClick}
                onDelete={setDeleteTarget}
                lang={lang}
              />

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isReply
                      onDelete={setDeleteTarget}
                      lang={lang}
                    />
                  ))}
                </div>
              )}

              {/* Inline reply form */}
              {replyTo === comment.id && (
                <div className="mt-3 ml-4 border-l-2 border-primary/20 pl-4 sm:ml-6 sm:pl-6">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    onSuccess={handleCommentSuccess}
                    onCancel={() => setReplyTo(null)}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        lang={lang}
      />
    </section>
  );
}
