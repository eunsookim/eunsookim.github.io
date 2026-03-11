import { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://eunsookim.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch published posts
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("is_published", true);

  // Fetch all projects
  const { data: projects } = await supabase
    .from("projects")
    .select("slug, updated_at");

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic blog pages
  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic portfolio pages
  const portfolioPages: MetadataRoute.Sitemap = (projects ?? []).map((project) => ({
    url: `${BASE_URL}/portfolio/${project.slug}`,
    lastModified: new Date(project.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...blogPages, ...portfolioPages];
}
