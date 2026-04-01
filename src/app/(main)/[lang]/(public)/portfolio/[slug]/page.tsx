import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Github } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface PortfolioDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

async function getProject(slug: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  return project as Project | null;
}

export async function generateMetadata({
  params,
}: PortfolioDetailPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {
      title: lang === "en" ? "Project not found" : "프로젝트를 찾을 수 없습니다",
    };
  }

  const title = (lang === "en" && project.title_en) || project.title;
  const description =
    ((lang === "en" && project.description_en) || project.description) ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(project.thumbnail ? { images: [project.thumbnail] } : {}),
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const { lang, slug } = await params;
  const project = await getProject(slug);
  const t = getMessages(lang as Lang);

  if (!project) {
    notFound();
  }

  const title = (lang === "en" && project.title_en) || project.title;
  const description =
    (lang === "en" && project.description_en) || project.description;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* Back link */}
      <Link
        href={`/${lang}/portfolio`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <span>&larr;</span>
        <span>{t.portfolio.title}</span>
      </Link>

      {/* Thumbnail */}
      {project.thumbnail && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image
            src={project.thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            unoptimized
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>

        {/* External links */}
        <div className="mt-4 flex flex-wrap gap-3">
          {project.demo_url && (
            <Button
              variant="outline"
              size="sm"
              render={
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLink className="size-3.5" />
              {t.portfolio.demo}
            </Button>
          )}
          {project.github_url && (
            <Button
              variant="outline"
              size="sm"
              render={
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Github className="size-3.5" />
              {t.portfolio.github}
            </Button>
          )}
        </div>

        {/* Tech stack */}
        {project.tech_stack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {project.tech_stack.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Description */}
      {description && (
        <div className="prose prose-invert max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
          {description}
        </div>
      )}
    </article>
  );
}
