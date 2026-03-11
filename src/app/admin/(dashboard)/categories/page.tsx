"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Category, Series } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  color: string;
};

type SeriesForm = {
  title: string;
  slug: string;
  description: string;
};

const emptyCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  color: "#22c55e",
};

const emptySeriesForm: SeriesForm = {
  title: "",
  slug: "",
  description: "",
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AdminCategoriesPage() {
  // --- shared ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- categories ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategoryForm);
  const [catSlugManual, setCatSlugManual] = useState(false);

  // --- series ---
  const [series, setSeries] = useState<Series[]>([]);
  const [seriesFormOpen, setSeriesFormOpen] = useState(false);
  const [seriesDeleteOpen, setSeriesDeleteOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [deletingSeries, setDeletingSeries] = useState<Series | null>(null);
  const [seriesForm, setSeriesForm] = useState<SeriesForm>(emptySeriesForm);
  const [seriesSlugManual, setSeriesSlugManual] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [catRes, seriesRes] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("series")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (catRes.error) {
      toast.error("카테고리 목록을 불러오지 못했습니다.");
    } else {
      setCategories((catRes.data ?? []) as Category[]);
    }

    if (seriesRes.error) {
      toast.error("시리즈 목록을 불러오지 못했습니다.");
    } else {
      setSeries((seriesRes.data ?? []) as Series[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Category CRUD helpers
  // -------------------------------------------------------------------------

  function openNewCatForm() {
    setEditingCatId(null);
    setCatForm(emptyCategoryForm);
    setCatSlugManual(false);
    setCatFormOpen(true);
  }

  function openEditCatForm(cat: Category) {
    setEditingCatId(cat.id);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      color: cat.color ?? "#22c55e",
    });
    setCatSlugManual(true);
    setCatFormOpen(true);
  }

  function openDeleteCatDialog(cat: Category) {
    setDeletingCat(cat);
    setCatDeleteOpen(true);
  }

  function handleCatNameChange(value: string) {
    setCatForm((prev) => ({
      ...prev,
      name: value,
      slug: catSlugManual ? prev.slug : slugify(value),
    }));
  }

  function handleCatSlugChange(value: string) {
    setCatSlugManual(true);
    setCatForm((prev) => ({ ...prev, slug: value }));
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!catForm.name.trim() || !catForm.slug.trim()) {
      toast.error("이름과 슬러그는 필수입니다.");
      return;
    }

    setSaving(true);

    const payload = {
      name: catForm.name.trim(),
      slug: catForm.slug.trim(),
      description: catForm.description.trim() || null,
      color: catForm.color || null,
    };

    const supabase = createClient();

    if (editingCatId) {
      const { error } = await supabase
        .from("categories")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingCatId);

      if (error) {
        toast.error("카테고리 수정에 실패했습니다.");
      } else {
        toast.success("카테고리가 수정되었습니다.");
        setCatFormOpen(false);
        fetchAll();
      }
    } else {
      const { error } = await supabase.from("categories").insert(payload);

      if (error) {
        toast.error("카테고리 생성에 실패했습니다.");
      } else {
        toast.success("카테고리가 생성되었습니다.");
        setCatFormOpen(false);
        fetchAll();
      }
    }

    setSaving(false);
  }

  async function handleCatDelete() {
    if (!deletingCat) return;

    setSaving(true);

    const { error } = await createClient()
      .from("categories")
      .delete()
      .eq("id", deletingCat.id);

    if (error) {
      toast.error("카테고리 삭제에 실패했습니다.");
    } else {
      toast.success("카테고리가 삭제되었습니다.");
      setCatDeleteOpen(false);
      setDeletingCat(null);
      fetchAll();
    }

    setSaving(false);
  }

  // -------------------------------------------------------------------------
  // Series CRUD helpers
  // -------------------------------------------------------------------------

  function openNewSeriesForm() {
    setEditingSeriesId(null);
    setSeriesForm(emptySeriesForm);
    setSeriesSlugManual(false);
    setSeriesFormOpen(true);
  }

  function openEditSeriesForm(s: Series) {
    setEditingSeriesId(s.id);
    setSeriesForm({
      title: s.title,
      slug: s.slug,
      description: s.description ?? "",
    });
    setSeriesSlugManual(true);
    setSeriesFormOpen(true);
  }

  function openDeleteSeriesDialog(s: Series) {
    setDeletingSeries(s);
    setSeriesDeleteOpen(true);
  }

  function handleSeriesTitleChange(value: string) {
    setSeriesForm((prev) => ({
      ...prev,
      title: value,
      slug: seriesSlugManual ? prev.slug : slugify(value),
    }));
  }

  function handleSeriesSlugChange(value: string) {
    setSeriesSlugManual(true);
    setSeriesForm((prev) => ({ ...prev, slug: value }));
  }

  async function handleSeriesSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!seriesForm.title.trim() || !seriesForm.slug.trim()) {
      toast.error("제목과 슬러그는 필수입니다.");
      return;
    }

    setSaving(true);

    const payload = {
      title: seriesForm.title.trim(),
      slug: seriesForm.slug.trim(),
      description: seriesForm.description.trim() || null,
    };

    const supabase = createClient();

    if (editingSeriesId) {
      const { error } = await supabase
        .from("series")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingSeriesId);

      if (error) {
        toast.error("시리즈 수정에 실패했습니다.");
      } else {
        toast.success("시리즈가 수정되었습니다.");
        setSeriesFormOpen(false);
        fetchAll();
      }
    } else {
      const { error } = await supabase.from("series").insert(payload);

      if (error) {
        toast.error("시리즈 생성에 실패했습니다.");
      } else {
        toast.success("시리즈가 생성되었습니다.");
        setSeriesFormOpen(false);
        fetchAll();
      }
    }

    setSaving(false);
  }

  async function handleSeriesDelete() {
    if (!deletingSeries) return;

    setSaving(true);

    const { error } = await createClient()
      .from("series")
      .delete()
      .eq("id", deletingSeries.id);

    if (error) {
      toast.error("시리즈 삭제에 실패했습니다.");
    } else {
      toast.success("시리즈가 삭제되었습니다.");
      setSeriesDeleteOpen(false);
      setDeletingSeries(null);
      fetchAll();
    }

    setSaving(false);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary">
          Categories &amp; Series
        </h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          <span className="text-primary">$</span> taxonomy --manage
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="series">시리즈</TabsTrigger>
        </TabsList>

        {/* ---- Category Tab ---- */}
        <TabsContent value="categories" className="space-y-4 pt-4">
          <div className="flex items-center justify-end">
            <Button onClick={openNewCatForm} size="sm">
              <PlusCircle className="size-4" />
              추가
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((cat) => (
                <Card key={cat.id} size="sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color ?? "#22c55e" }}
                      />
                      <CardTitle className="font-mono">{cat.name}</CardTitle>
                      <span className="font-mono text-xs text-muted-foreground">
                        /{cat.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditCatForm(cat)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteCatDialog(cat)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  {cat.description && (
                    <CardContent>
                      <p className="font-mono text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
                카테고리가 없습니다. 새 카테고리를 추가해보세요.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---- Series Tab ---- */}
        <TabsContent value="series" className="space-y-4 pt-4">
          <div className="flex items-center justify-end">
            <Button onClick={openNewSeriesForm} size="sm">
              <PlusCircle className="size-4" />
              추가
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : series.length > 0 ? (
            <div className="space-y-3">
              {series.map((s) => (
                <Card key={s.id} size="sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="font-mono">{s.title}</CardTitle>
                      <span className="font-mono text-xs text-muted-foreground">
                        /{s.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditSeriesForm(s)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteSeriesDialog(s)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  {s.description && (
                    <CardContent>
                      <p className="font-mono text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
                시리즈가 없습니다. 새 시리즈를 추가해보세요.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================= */}
      {/* Category Create / Edit Dialog                                     */}
      {/* ================================================================= */}
      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">
              {editingCatId ? "카테고리 수정" : "새 카테고리"}
            </DialogTitle>
            <DialogDescription>
              카테고리 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCatSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">이름</Label>
              <Input
                id="cat-name"
                value={catForm.name}
                onChange={(e) => handleCatNameChange(e.target.value)}
                placeholder="카테고리 이름"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">슬러그</Label>
              <Input
                id="cat-slug"
                value={catForm.slug}
                onChange={(e) => handleCatSlugChange(e.target.value)}
                placeholder="category-slug"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description">설명</Label>
              <Textarea
                id="cat-description"
                value={catForm.description}
                onChange={(e) =>
                  setCatForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="카테고리에 대한 설명 (선택)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-color">색상</Label>
              <div className="flex items-center gap-3">
                <input
                  id="cat-color"
                  type="color"
                  value={catForm.color}
                  onChange={(e) =>
                    setCatForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-1"
                />
                <Input
                  value={catForm.color}
                  onChange={(e) =>
                    setCatForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  placeholder="#22c55e"
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editingCatId ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation */}
      <Dialog open={catDeleteOpen} onOpenChange={setCatDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">카테고리 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deletingCat?.name}&quot;을(를) 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCatDeleteOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleCatDelete}
              disabled={saving}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Series Create / Edit Dialog                                       */}
      {/* ================================================================= */}
      <Dialog open={seriesFormOpen} onOpenChange={setSeriesFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">
              {editingSeriesId ? "시리즈 수정" : "새 시리즈"}
            </DialogTitle>
            <DialogDescription>
              시리즈 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSeriesSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="series-title">제목</Label>
              <Input
                id="series-title"
                value={seriesForm.title}
                onChange={(e) => handleSeriesTitleChange(e.target.value)}
                placeholder="시리즈 제목"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="series-slug">슬러그</Label>
              <Input
                id="series-slug"
                value={seriesForm.slug}
                onChange={(e) => handleSeriesSlugChange(e.target.value)}
                placeholder="series-slug"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="series-description">설명</Label>
              <Textarea
                id="series-description"
                value={seriesForm.description}
                onChange={(e) =>
                  setSeriesForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="시리즈에 대한 설명 (선택)"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editingSeriesId ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Series Delete Confirmation */}
      <Dialog open={seriesDeleteOpen} onOpenChange={setSeriesDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">시리즈 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deletingSeries?.title}&quot;을(를) 삭제하시겠습니까? 이
              작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSeriesDeleteOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleSeriesDelete}
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
