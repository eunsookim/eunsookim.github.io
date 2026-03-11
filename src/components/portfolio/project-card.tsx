import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";

interface ProjectCardProps {
  project: Project;
  lang: Lang;
}

export function ProjectCard({ project, lang }: ProjectCardProps) {
  const title =
    lang === "en" ? (project.title_en ?? project.title) : project.title;
  const description =
    lang === "en"
      ? (project.description_en ?? project.description)
      : project.description;

  return (
    <Link href={`/${lang}/portfolio/${project.slug}`} className="group block">
      <Card className="h-full transition-colors hover:ring-primary/40">
        {project.thumbnail && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            <Image
              src={project.thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}

        <CardHeader>
          <CardTitle className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="line-clamp-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        {project.tech_stack.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {project.tech_stack.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
