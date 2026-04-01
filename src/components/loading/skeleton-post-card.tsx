import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonPostCard() {
  return (
    <Card>
      {/* Cover image */}
      <Skeleton className="aspect-[2/1] w-full rounded-t-xl rounded-b-none" />

      <CardHeader>
        {/* Category badge */}
        <div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Excerpt */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </CardHeader>

      {/* Tags */}
      <CardContent>
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardContent>

      {/* Date & view count */}
      <CardFooter>
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardFooter>
    </Card>
  )
}
