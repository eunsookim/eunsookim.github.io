import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/admin/post-editor";

export default async function NewPostPage() {
  const supabase = await createClient();

  const [categoriesResult, seriesResult] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("series").select("*").order("title"),
  ]);

  const categories = categoriesResult.data ?? [];
  const seriesList = seriesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary">
          새 글 작성
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">새로운 글을 작성합니다</p>
      </div>

      <PostEditor categories={categories} seriesList={seriesList} />
    </div>
  );
}
