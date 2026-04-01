import { ProgressBar } from "@/components/loading/progress-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonPostCard } from "@/components/loading/skeleton-post-card"

export default function BlogLoading() {
  return (
    <>
      <ProgressBar />
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>

        <div className="mt-6 flex gap-8 lg:mt-0">
          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Search bar */}
            <div className="mb-6">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Post cards */}
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonPostCard key={i} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20 space-y-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
