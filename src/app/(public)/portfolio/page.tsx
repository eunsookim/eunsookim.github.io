import type { Metadata } from "next";

import { ProjectCard } from "@/components/portfolio/project-card";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "프로젝트 포트폴리오 - 개발한 프로젝트들을 소개합니다.",
  openGraph: {
    title: "Portfolio | eunsookim.dev",
    description: "프로젝트 포트폴리오 - 개발한 프로젝트들을 소개합니다.",
  },
};

export default async function PortfolioPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const typedProjects = (projects ?? []) as Project[];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-primary">
          <span className="text-muted-foreground">$</span> ls ./portfolio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          개발한 프로젝트들을 소개합니다
        </p>
      </div>

      {/* Project grid */}
      {typedProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {typedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-mono text-muted-foreground">
            <span className="text-primary">$</span> echo &quot;프로젝트가 아직
            없습니다&quot;
          </p>
        </div>
      )}
    </section>
  );
}
