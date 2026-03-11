"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ImageUpload } from "@/components/admin/image-upload";

type ProjectForm = {
  title: string;
  slug: string;
  description: string;
  title_en: string;
  description_en: string;
  demo_url: string;
  github_url: string;
  tech_stack: string;
  thumbnail: string;
};

const emptyForm: ProjectForm = {
  title: "",
  slug: "",
  description: "",
  title_en: "",
  description_en: "",
  demo_url: "",
  github_url: "",
  tech_stack: "",
  thumbnail: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await createClient()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("프로젝트 목록을 불러오지 못했습니다.");
    } else {
      setProjects((data ?? []) as Project[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugManuallyEdited(false);
    setFormOpen(true);
  }

  function openEditForm(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description ?? "",
      title_en: project.title_en ?? "",
      description_en: project.description_en ?? "",
      demo_url: project.demo_url ?? "",
      github_url: project.github_url ?? "",
      tech_stack: project.tech_stack.join(", "),
      thumbnail: project.thumbnail ?? "",
    });
    setSlugManuallyEdited(true);
    setFormOpen(true);
  }

  function openDeleteDialog(project: Project) {
    setDeletingProject(project);
    setDeleteOpen(true);
  }

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("제목과 슬러그는 필수입니다.");
      return;
    }

    setSaving(true);

    const techStack = form.tech_stack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      title_en: form.title_en.trim() || null,
      description_en: form.description_en.trim() || null,
      demo_url: form.demo_url.trim() || null,
      github_url: form.github_url.trim() || null,
      tech_stack: techStack,
      thumbnail: form.thumbnail || null,
    };

    const supabase = createClient();

    if (editingId) {
      const { error } = await supabase
        .from("projects")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId);

      if (error) {
        toast.error("프로젝트 수정에 실패했습니다.");
      } else {
        toast.success("프로젝트가 수정되었습니다.");
        setFormOpen(false);
        fetchProjects();
      }
    } else {
      const { error } = await supabase.from("projects").insert(payload);

      if (error) {
        toast.error("프로젝트 생성에 실패했습니다.");
      } else {
        toast.success("프로젝트가 생성되었습니다.");
        setFormOpen(false);
        fetchProjects();
      }
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!deletingProject) return;

    setSaving(true);

    const { error } = await createClient()
      .from("projects")
      .delete()
      .eq("id", deletingProject.id);

    if (error) {
      toast.error("프로젝트 삭제에 실패했습니다.");
    } else {
      toast.success("프로젝트가 삭제되었습니다.");
      setDeleteOpen(false);
      setDeletingProject(null);
      fetchProjects();
    }

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-primary">
            Portfolio
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            <span className="text-primary">$</span> projects --list --all
          </p>
        </div>
        <Button onClick={openNewForm}>
          <PlusCircle className="size-4" />
          New Project
        </Button>
      </div>

      {/* Project list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <Card key={project.id} size="sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="font-mono">
                    {project.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditForm(project)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openDeleteDialog(project)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                  {project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack.map((tech) => (
                        <Badge
                          key={tech}
                          variant="outline"
                          className="text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <span className="ml-auto">
                    {new Date(project.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center font-mono text-sm text-muted-foreground">
            프로젝트가 없습니다. 새 프로젝트를 추가해보세요.
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">
              {editingId ? "프로젝트 수정" : "새 프로젝트"}
            </DialogTitle>
            <DialogDescription>
              프로젝트 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">제목</Label>
              <Input
                id="project-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="프로젝트 제목"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-title-en">Title (EN)</Label>
              <Input
                id="project-title-en"
                value={form.title_en}
                onChange={(e) => setForm((prev) => ({ ...prev, title_en: e.target.value }))}
                placeholder="Project title in English"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-slug">슬러그</Label>
              <Input
                id="project-slug"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="project-slug"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">설명</Label>
              <Textarea
                id="project-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="프로젝트에 대한 설명"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-desc-en">Description (EN)</Label>
              <Textarea
                id="project-desc-en"
                value={form.description_en}
                onChange={(e) => setForm((prev) => ({ ...prev, description_en: e.target.value }))}
                placeholder="Project description in English"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-demo-url">Demo URL</Label>
              <Input
                id="project-demo-url"
                value={form.demo_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, demo_url: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-github-url">GitHub URL</Label>
              <Input
                id="project-github-url"
                value={form.github_url}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    github_url: e.target.value,
                  }))
                }
                placeholder="https://github.com/user/repo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-tech-stack">
                기술 스택 (쉼표로 구분)
              </Label>
              <Input
                id="project-tech-stack"
                value={form.tech_stack}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tech_stack: e.target.value,
                  }))
                }
                placeholder="Next.js, TypeScript, Supabase"
              />
            </div>

            <div className="space-y-2">
              <Label>썸네일</Label>
              <ImageUpload
                folder="portfolio"
                currentImage={form.thumbnail || undefined}
                onUpload={(url) =>
                  setForm((prev) => ({ ...prev, thumbnail: url }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editingId ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">프로젝트 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deletingProject?.title}&quot;을(를) 삭제하시겠습니까? 이
              작업은 되돌릴 수 없습니다.
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
