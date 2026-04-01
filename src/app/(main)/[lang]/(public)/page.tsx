import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations, Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

import { ScrollProgress } from "@/components/landing/scroll-progress";
import { HeroSection } from "@/components/landing/hero-section";
import { GradientDivider } from "@/components/landing/gradient-divider";
import { TechStackSection } from "@/components/landing/tech-stack-section";
import { FeaturedProjectsSection } from "@/components/landing/featured-projects-section";
import { LatestPostsSection } from "@/components/landing/latest-posts-section";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";

async function getLatestPosts(): Promise<PostWithRelations[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Failed to fetch posts:", error.message);
      return [];
    }

    return (data ?? []).map((post) => ({
      ...post,
      tags: post.tags ?? [],
    })) as PostWithRelations[];
  } catch {
    return [];
  }
}

async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const supabase = await createClient();

    // Try featured first
    const { data: featured } = await supabase
      .from("projects")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (featured && featured.length > 0) return featured as Project[];

    // Fallback to latest
    const { data: latest } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    return (latest ?? []) as Project[];
  } catch {
    return [];
  }
}

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  const [posts, projects] = await Promise.all([
    getLatestPosts(),
    getFeaturedProjects(),
  ]);

  return (
    <>
      <ScrollProgress />

      <HeroSection lang={lang as Lang} t={t.landing} />

      <GradientDivider />

      <TechStackSection title={t.landing.techStack} />

      <GradientDivider />

      <FeaturedProjectsSection
        lang={lang as Lang}
        projects={projects}
        t={t.landing}
      />

      <GradientDivider />

      <LatestPostsSection
        lang={lang as Lang}
        posts={posts}
        t={t.landing}
      />

      <FooterCtaSection t={t.landing} />
    </>
  );
}
