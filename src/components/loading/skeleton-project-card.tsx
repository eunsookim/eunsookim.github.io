import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonProjectCard() {
  return (
    <Card className="h-full">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full rounded-t-xl rounded-b-none" />

      <CardHeader>
        {/* Title */}
        <Skeleton className="h-5 w-2/3" />
        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </CardHeader>

      {/* Tech badges */}
      <CardContent>
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
