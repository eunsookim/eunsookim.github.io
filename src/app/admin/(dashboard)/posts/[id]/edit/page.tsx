import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PostEditor } from "@/components/admin/post-editor";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [postResult, categoriesResult, seriesResult] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("name"),
    supabase.from("series").select("*").order("title"),
  ]);

  if (!postResult.data) {
    notFound();
  }

  const post = postResult.data;
  const categories = categoriesResult.data ?? [];
  const seriesList = seriesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary">글 수정</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          <span className="text-primary">$</span> posts --edit &quot;{post.title}&quot;
        </p>
      </div>

      <PostEditor
        post={post}
        categories={categories}
        seriesList={seriesList}
      />
    </div>
  );
}
