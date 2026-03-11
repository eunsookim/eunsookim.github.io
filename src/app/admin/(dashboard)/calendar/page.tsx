"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusCircle, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CalendarStatus = "pending" | "generated" | "published" | "skipped";

type CalendarItem = {
  id: string;
  scheduled_date: string;
  topic: string;
  category_slug: string | null;
  tags: string[];
  key_points: string[];
  references: string[];
  status: CalendarStatus;
  generated_post_id: string | null;
  created_at: string;
};

type CalendarForm = {
  scheduled_date: string;
  topic: string;
  category_slug: string;
  tags: string;
  key_points: string;
  references: string;
};

const emptyForm: CalendarForm = {
  scheduled_date: "",
  topic: "",
  category_slug: "",
  tags: "",
  key_points: "",
  references: "",
};

// ---------------------------------------------------------------------------
// Status filter config
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { key: CalendarStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "Pending" },
  { key: "generated", label: "Generated" },
  { key: "published", label: "Published" },
  { key: "skipped", label: "Skipped" },
];

const STATUS_BADGE: Record<
  CalendarStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pending", variant: "outline" },
  generated: { label: "Generated", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  skipped: { label: "Skipped", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AdminCalendarPage() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<CalendarStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CalendarForm>(emptyForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CalendarItem | null>(null);

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("content_calendar")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("캘린더 항목을 불러오지 못했습니다.");
    } else {
      setItems((data ?? []) as CalendarItem[]);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // -------------------------------------------------------------------------
  // Add form
  // -------------------------------------------------------------------------

  function openAddForm() {
    setForm({
      ...emptyForm,
      scheduled_date: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.scheduled_date || !form.topic.trim()) {
      toast.error("날짜와 주제는 필수입니다.");
      return;
    }

    setSaving(true);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const key_points = form.key_points
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const references = form.references
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const payload = {
      scheduled_date: form.scheduled_date,
      topic: form.topic.trim(),
      category_slug: form.category_slug.trim() || null,
      tags,
      key_points,
      references,
      status: "pending" as const,
    };

    const { error } = await createClient()
      .from("content_calendar")
      .insert(payload);

    if (error) {
      toast.error("항목 추가에 실패했습니다.");
    } else {
      toast.success("캘린더 항목이 추가되었습니다.");
      setFormOpen(false);
      fetchItems();
    }

    setSaving(false);
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  function openDeleteDialog(item: CalendarItem) {
    setDeletingItem(item);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;

    setSaving(true);

    const { error } = await createClient()
      .from("content_calendar")
      .delete()
      .eq("id", deletingItem.id);

    if (error) {
      toast.error("항목 삭제에 실패했습니다.");
    } else {
      toast.success("캘린더 항목이 삭제되었습니다.");
      setDeleteOpen(false);
      setDeletingItem(null);
      fetchItems();
    }

    setSaving(false);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const filteredItems = items;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-primary">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            콘텐츠 캘린더 관리
          </p>
        </div>
        <Button onClick={openAddForm} size="sm">
          <PlusCircle className="size-4" />
          새 항목
        </Button>
      </div>

      {/* Status filter tabs */}
      <nav className="flex gap-1 border-b border-border">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              filter === f.key
                ? "border-b-2 border-primary font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {/* Calendar item list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <CalendarItemCard
              key={item.id}
              item={item}
              onDelete={() => openDeleteDialog(item)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
            {filter === "all"
              ? "캘린더 항목이 없습니다. 새 항목을 추가해보세요."
              : `"${filter}" 상태의 항목이 없습니다.`}
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* Add Item Dialog                                                   */}
      {/* ================================================================= */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">새 캘린더 항목</DialogTitle>
            <DialogDescription>
              AI 초안 생성을 위한 콘텐츠 일정을 추가하세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cal-date">날짜</Label>
              <Input
                id="cal-date"
                type="date"
                value={form.scheduled_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduled_date: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-topic">주제</Label>
              <Input
                id="cal-topic"
                value={form.topic}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="블로그 글 주제"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-category">카테고리 슬러그 (선택)</Label>
              <Input
                id="cal-category"
                value={form.category_slug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category_slug: e.target.value,
                  }))
                }
                placeholder="category-slug"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-tags">태그 (쉼표 구분)</Label>
              <Input
                id="cal-tags"
                value={form.tags}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="react, nextjs, typescript"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-keypoints">핵심 포인트 (줄바꿈 구분)</Label>
              <Textarea
                id="cal-keypoints"
                value={form.key_points}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    key_points: e.target.value,
                  }))
                }
                placeholder={"포인트 1\n포인트 2\n포인트 3"}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-refs">참고 자료 (줄바꿈 구분)</Label>
              <Textarea
                id="cal-refs"
                value={form.references}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    references: e.target.value,
                  }))
                }
                placeholder={"https://example.com/article\nhttps://docs.example.com"}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                추가
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Delete Confirmation Dialog                                        */}
      {/* ================================================================= */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">항목 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deletingItem?.topic}&quot;을(를) 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalendarItemCard (sub-component)
// ---------------------------------------------------------------------------

function CalendarItemCard({
  item,
  onDelete,
}: {
  item: CalendarItem;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = STATUS_BADGE[item.status];

  const hasDetails =
    item.tags.length > 0 ||
    item.key_points.length > 0 ||
    item.references.length > 0;

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {item.scheduled_date}
          </span>
          <CardTitle className="font-mono">{item.topic}</CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          {item.category_slug && (
            <span className="font-mono text-xs text-muted-foreground">
              /{item.category_slug}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasDetails && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "접기" : "펼치기"}
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>

      {expanded && hasDetails && (
        <CardContent className="space-y-3">
          {item.tags.length > 0 && (
            <div>
              <p className="mb-1 font-mono text-xs font-medium text-muted-foreground">
                태그
              </p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {item.key_points.length > 0 && (
            <div>
              <Separator className="mb-3" />
              <p className="mb-1 font-mono text-xs font-medium text-muted-foreground">
                핵심 포인트
              </p>
              <ul className="list-inside list-disc space-y-0.5 font-mono text-xs text-foreground">
                {item.key_points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {item.references.length > 0 && (
            <div>
              <Separator className="mb-3" />
              <p className="mb-1 font-mono text-xs font-medium text-muted-foreground">
                참고 자료
              </p>
              <ul className="list-inside list-disc space-y-0.5 font-mono text-xs">
                {item.references.map((ref, i) => (
                  <li key={i}>
                    {ref.startsWith("http") ? (
                      <a
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {ref}
                      </a>
                    ) : (
                      <span className="text-foreground">{ref}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
