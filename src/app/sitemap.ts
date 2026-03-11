import { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_LANGS } from "@/lib/i18n/utils";

const BASE_URL = "https://eunsookim.dev";

function langAlternates(path: string) {
  return {
    languages: {
      ...Object.fromEntries(
        SUPPORTED_LANGS.map((l) => [l, `${BASE_URL}/${l}${path}`]),
      ),
      "x-default": `${BASE_URL}/ko${path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: posts }, { data: projects }] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, updated_at")
      .eq("is_published", true),
    supabase.from("projects").select("slug, updated_at"),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — generate for each language
  const staticPaths: {
    path: string;
    freq: "daily" | "weekly" | "monthly";
    priority: number;
  }[] = [
    { path: "", freq: "weekly", priority: 1 },
    { path: "/blog", freq: "daily", priority: 0.9 },
    { path: "/portfolio", freq: "weekly", priority: 0.8 },
    { path: "/about", freq: "monthly", priority: 0.7 },
  ];

  for (const lang of SUPPORTED_LANGS) {
    for (const { path, freq, priority } of staticPaths) {
      entries.push({
        url: `${BASE_URL}/${lang}${path}`,
        lastModified: new Date(),
        changeFrequency: freq,
        priority,
        alternates: langAlternates(path),
      });
    }
  }

  // Blog posts
  for (const post of posts ?? []) {
    for (const lang of SUPPORTED_LANGS) {
      entries.push({
        url: `${BASE_URL}/${lang}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: langAlternates(`/blog/${post.slug}`),
      });
    }
  }

  // Portfolio projects
  for (const project of projects ?? []) {
    for (const lang of SUPPORTED_LANGS) {
      entries.push({
        url: `${BASE_URL}/${lang}/portfolio/${project.slug}`,
        lastModified: new Date(project.updated_at),
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: langAlternates(`/portfolio/${project.slug}`),
      });
    }
  }

  return entries;
}
