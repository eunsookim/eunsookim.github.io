import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import type { PostWithRelations } from "@/lib/types";

interface PostCardProps {
  post: PostWithRelations;
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <Card className="transition-colors hover:ring-primary/40">
        {post.cover_image && (
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-t-xl">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        <CardHeader>
          {post.category && (
            <div>
              <Badge
                variant="secondary"
                className="text-xs"
                style={
                  post.category.color
                    ? {
                        backgroundColor: `${post.category.color}20`,
                        color: post.category.color,
                        borderColor: `${post.category.color}40`,
                      }
                    : undefined
                }
              >
                {post.category.name}
              </Badge>
            </div>
          )}
          <CardTitle className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
            {post.title}
          </CardTitle>
          {post.excerpt && (
            <CardDescription className="line-clamp-2">
              {post.excerpt}
            </CardDescription>
          )}
        </CardHeader>

        {post.tags.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}

        {formattedDate && (
          <CardFooter>
            <time
              dateTime={post.published_at!}
              className="text-xs text-muted-foreground"
            >
              {formattedDate}
            </time>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
