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

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/portfolio/${project.slug}`} className="group block">
      <Card className="h-full transition-colors hover:ring-primary/40">
        {project.thumbnail && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}

        <CardHeader>
          <CardTitle className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
            {project.title}
          </CardTitle>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
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
