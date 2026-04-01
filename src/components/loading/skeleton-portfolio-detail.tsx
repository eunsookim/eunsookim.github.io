import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonPortfolioDetail() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-20" />

      {/* Thumbnail */}
      <Skeleton className="mb-8 aspect-video w-full rounded-lg" />

      {/* Title */}
      <Skeleton className="mb-4 h-9 w-2/3" />

      {/* Action buttons */}
      <div className="mb-4 flex gap-3">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      {/* Tech badges */}
      <div className="mb-8 flex flex-wrap gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
      </div>

      {/* Description lines */}
      <div className="space-y-2">
        {[100, 95, 88, 92, 100, 85, 78, 60].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
    </article>
  )
}
