import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Github } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

interface PortfolioDetailPageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return { title: "프로젝트를 찾을 수 없습니다" };
  }

  return {
    title: project.title,
    description: project.description ?? undefined,
    openGraph: {
      title: project.title,
      description: project.description ?? undefined,
      type: "article",
      ...(project.thumbnail ? { images: [project.thumbnail] } : {}),
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* Back link */}
      <Link
        href="/portfolio"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <span>&larr;</span>
        <span>포트폴리오 목록</span>
      </Link>

      {/* Thumbnail */}
      {project.thumbnail && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image
            src={project.thumbnail}
            alt={project.title}
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
          {project.title}
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
              Demo
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
              GitHub
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
      {project.description && (
        <div className="prose prose-invert max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </div>
      )}
    </article>
  );
}
