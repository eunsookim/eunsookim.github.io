"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import type { Post, Category, Series } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PostMetaBar } from "@/components/admin/post-meta-bar";

// MDEditor uses browser APIs, so we must load it client-side only
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function draftKey(postId?: string): string {
  return postId ? `post-draft-${postId}` : "post-draft-new";
}

interface DraftState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string | null;
  seriesId: string | null;
  seriesOrder: number | null;
  tags: string[];
  coverImage: string | null;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PostEditorProps {
  post?: Post;
  categories: Category[];
  seriesList: Series[];
}

export function PostEditor({ post, categories, seriesList }: PostEditorProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // ------ State ------
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    post?.category_id ?? null,
  );
  const [seriesId, setSeriesId] = useState<string | null>(
    post?.series_id ?? null,
  );
  const [seriesOrder, setSeriesOrder] = useState<number | null>(
    post?.series_order ?? null,
  );
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [coverImage, setCoverImage] = useState<string | null>(
    post?.cover_image ?? null,
  );

  const [saving, setSaving] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);

  // Track whether user has manually edited the slug
  const slugManuallyEdited = useRef(!!post);
  // Track unsaved changes for beforeunload
  const isDirty = useRef(false);

  // Image folder: temp/{uuid} for new, blog/{slug} for existing
  const imageFolderRef = useRef(
    post ? `blog/${post.slug}` : `temp/${crypto.randomUUID()}`,
  );
  const imageFolder = imageFolderRef.current;

  // ------ Auto-slug ------
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      isDirty.current = true;
      if (!slugManuallyEdited.current) {
        setSlug(slugify(value));
      }
    },
    [],
  );

  const handleSlugChange = useCallback((value: string) => {
    slugManuallyEdited.current = true;
    setSlug(value);
    isDirty.current = true;
  }, []);

  // Mark dirty on any change
  const markDirty = useCallback(() => {
    isDirty.current = true;
  }, []);

  // ------ Restore draft from localStorage on mount ------
  useEffect(() => {
    const key = draftKey(post?.id);
    const stored = localStorage.getItem(key);
    if (!stored) return;

    try {
      const draft: DraftState = JSON.parse(stored);
      const savedDate = new Date(draft.savedAt).toLocaleString("ko-KR");
      const shouldRestore = window.confirm(
        `자동 저장된 초안이 있습니다 (${savedDate}).\n복원하시겠습니까?`,
      );
      if (shouldRestore) {
        setTitle(draft.title);
        setSlug(draft.slug);
        setExcerpt(draft.excerpt);
        setContent(draft.content);
        setCategoryId(draft.categoryId);
        setSeriesId(draft.seriesId);
        setSeriesOrder(draft.seriesOrder);
        setTags(draft.tags);
        setCoverImage(draft.coverImage);
        // If slug was set, consider it manually edited
        if (draft.slug) slugManuallyEdited.current = true;
      }
    } catch {
      // Corrupt data — ignore
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------ Autosave to localStorage every 30s ------
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDirty.current) return;

      const draft: DraftState = {
        title,
        slug,
        excerpt,
        content,
        categoryId,
        seriesId,
        seriesOrder,
        tags,
        coverImage,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey(post?.id), JSON.stringify(draft));
      setAutoSavedAt(new Date().toLocaleTimeString("ko-KR"));
    }, 30_000);

    return () => clearInterval(interval);
  }, [
    title,
    slug,
    excerpt,
    content,
    categoryId,
    seriesId,
    seriesOrder,
    tags,
    coverImage,
    post?.id,
  ]);

  // ------ beforeunload ------
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ------ Save / Publish ------
  const handleSave = useCallback(
    async (publish: boolean) => {
      if (!title.trim()) {
        toast.error("제목을 입력해주세요.");
        return;
      }
      if (!slug.trim()) {
        toast.error("슬러그를 입력해주세요.");
        return;
      }

      setSaving(true);

      try {
        const supabase = createClient();

        const payload = {
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content: content || null,
          cover_image: coverImage,
          category_id: categoryId,
          series_id: seriesId,
          series_order: seriesOrder,
          is_published: publish,
          tags,
          ...(publish && !post?.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
        };

        // TODO: When saving a new post with temp images, move images from
        // `temp/{uuid}/` to `blog/{slug}/`:
        //   1. List files in temp folder via supabase.storage.from('assets').list(tempFolder)
        //   2. Copy each file to `blog/{slug}/` path
        //   3. Delete originals from temp folder
        //   4. Update content markdown to replace temp URLs with new URLs
        // This is complex and should be refined in a future task.

        if (post) {
          // Update existing post
          const { error } = await supabase
            .from("posts")
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", post.id);
          if (error) throw error;
        } else {
          // Insert new post
          const { error } = await supabase.from("posts").insert(payload);
          if (error) throw error;
        }

        // Clear draft from localStorage
        localStorage.removeItem(draftKey(post?.id));
        isDirty.current = false;

        toast.success(
          publish ? "게시글이 발행되었습니다." : "임시 저장되었습니다.",
        );
        router.push("/admin/posts");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "저장에 실패했습니다.";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [
      title,
      slug,
      excerpt,
      content,
      coverImage,
      categoryId,
      seriesId,
      seriesOrder,
      tags,
      post,
      router,
    ],
  );

  const colorMode = useMemo(
    () => (resolvedTheme === "dark" ? "dark" : "light"),
    [resolvedTheme],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="post-title">제목</Label>
        <Input
          id="post-title"
          placeholder="게시글 제목"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="h-12 text-lg font-bold"
        />
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="post-slug">슬러그</Label>
        <Input
          id="post-slug"
          placeholder="url-friendly-slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <Label htmlFor="post-excerpt">요약</Label>
        <Textarea
          id="post-excerpt"
          placeholder="게시글 요약 (선택)"
          value={excerpt}
          onChange={(e) => {
            setExcerpt(e.target.value);
            markDirty();
          }}
          rows={2}
        />
      </div>

      {/* Meta Bar */}
      <PostMetaBar
        categories={categories}
        seriesList={seriesList}
        selectedCategoryId={categoryId}
        selectedSeriesId={seriesId}
        seriesOrder={seriesOrder}
        tags={tags}
        coverImage={coverImage}
        imageFolder={imageFolder}
        onCategoryChange={(id) => {
          setCategoryId(id);
          markDirty();
        }}
        onSeriesChange={(id) => {
          setSeriesId(id);
          markDirty();
        }}
        onSeriesOrderChange={(order) => {
          setSeriesOrder(order);
          markDirty();
        }}
        onTagsChange={(t) => {
          setTags(t);
          markDirty();
        }}
        onCoverImageChange={(url) => {
          setCoverImage(url);
          markDirty();
        }}
      />

      {/* Markdown Editor */}
      <div className="space-y-1.5">
        <Label>본문</Label>
        <div data-color-mode={colorMode}>
          <MDEditor
            value={content}
            onChange={(val) => {
              setContent(val ?? "");
              markDirty();
            }}
            height={500}
            preview="live"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="font-mono text-xs text-muted-foreground">
          {autoSavedAt && `자동 저장됨: ${autoSavedAt}`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => handleSave(false)}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            임시 저장
          </Button>
          <Button disabled={saving} onClick={() => handleSave(true)}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            발행
          </Button>
        </div>
      </div>
    </div>
  );
}
