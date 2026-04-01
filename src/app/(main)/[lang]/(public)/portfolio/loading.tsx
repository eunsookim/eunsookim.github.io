import { ProgressBar } from "@/components/loading/progress-bar"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonProjectCard } from "@/components/loading/skeleton-project-card"

export default function PortfolioLoading() {
  return (
    <>
      <ProgressBar />
      <section className="mx-auto max-w-4xl px-4 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>

        {/* Project grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </section>
    </>
  )
}
