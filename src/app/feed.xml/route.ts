import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://eunsookim.dev";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("slug, title, excerpt, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(20);

  const items = (posts ?? [])
    .map((post) => {
      const link = `${BASE_URL}/ko/blog/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : "";

      return `    <item>
      <title>${escapeXml(post.title ?? "")}</title>
      <link>${link}</link>
      <description>${escapeXml(post.excerpt ?? "")}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Solvlog</title>
    <link>${BASE_URL}</link>
    <description>Personal tech blog by Eunsoo Kim</description>
    <language>ko</language>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
