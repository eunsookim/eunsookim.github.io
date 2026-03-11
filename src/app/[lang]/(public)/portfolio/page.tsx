import type { Metadata } from "next";

import { ProjectCard } from "@/components/portfolio/project-card";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface PortfolioPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  return {
    title: t.portfolio.title,
    description: t.portfolio.description,
    openGraph: {
      title: `${t.portfolio.title} | eunsookim.dev`,
      description: t.portfolio.description,
    },
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);

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
          {t.portfolio.description}
        </p>
      </div>

      {/* Project grid */}
      {typedProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {typedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} lang={lang as Lang} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-mono text-muted-foreground">
            <span className="text-primary">$</span> echo &quot;{t.portfolio.noProjects}&quot;
          </p>
        </div>
      )}
    </section>
  );
}
