import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonBlogPost() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-24" />

      {/* Cover image */}
      <Skeleton className="mb-8 aspect-[2/1] w-full rounded-lg" />

      {/* 2-column layout */}
      <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-8">
        <article>
          {/* Title */}
          <Skeleton className="mb-4 h-9 w-3/4" />

          {/* Meta: date, views, category */}
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Tags */}
          <div className="mb-4 flex gap-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-18 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Share & like buttons */}
          <div className="mb-8 flex items-center gap-2">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>

          {/* Content paragraphs */}
          <div className="space-y-6">
            {[100, 95, 88, 70, 100, 92].map((w, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4" style={{ width: `${w}%` }} />
                <Skeleton className="h-4" style={{ width: `${w - 10}%` }} />
                <Skeleton className="h-4" style={{ width: `${w - 25}%` }} />
              </div>
            ))}
          </div>
        </article>

        {/* TOC sidebar */}
        <aside className="hidden self-start lg:block">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </aside>
      </div>
    </div>
  )
}
