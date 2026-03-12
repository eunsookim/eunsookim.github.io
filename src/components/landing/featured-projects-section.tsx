"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { TiltCard } from "./tilt-card";
import { SectionFadeIn } from "./section-fade-in";
import type { Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";

interface FeaturedProjectsSectionProps {
  lang: Lang;
  projects: Project[];
  t: {
    featuredProjects: string;
    viewAllProjects: string;
  };
}

function ProjectCard({
  project,
  lang,
  index,
}: {
  project: Project;
  lang: Lang;
  index: number;
}) {
  const title =
    lang === "en" ? (project.title_en ?? project.title) : project.title;
  const description =
    lang === "en"
      ? (project.description_en ?? project.description)
      : project.description;

  return (
    <SectionFadeIn delay={index * 0.15}>
      <TiltCard className="group relative overflow-hidden rounded-2xl">
        {/* Rotating gradient border — extends 1px beyond card bounds */}
        <div
          className="absolute -inset-px -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "conic-gradient(from var(--gradient-angle, 0deg), var(--primary), transparent 40%, var(--primary))",
            animation: "rotate-gradient 3s linear infinite",
          }}
        />
        <div className="glass-card h-full rounded-2xl">
          <Link
            href={project.demo_url ?? `/${lang}/portfolio`}
            target={project.demo_url ? "_blank" : undefined}
            rel={project.demo_url ? "noopener noreferrer" : undefined}
            className="flex flex-col gap-6 p-6 md:flex-row"
          >
            {/* Thumbnail with parallax hover */}
            {project.thumbnail && (
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl md:w-64">
                <Image
                  src={project.thumbnail}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:-translate-x-1 group-hover:-translate-y-1"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex flex-1 flex-col justify-center">
              <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                {title}
              </h3>
              {description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
              {project.tech_stack.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </div>
      </TiltCard>
    </SectionFadeIn>
  );
}

export function FeaturedProjectsSection({
  lang,
  projects,
  t,
}: FeaturedProjectsSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4">
        <SectionFadeIn>
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {t.featuredProjects}
            </h2>
            <Link
              href={`/${lang}/portfolio`}
              className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t.viewAllProjects}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </SectionFadeIn>

        <div className="space-y-6">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              lang={lang}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
