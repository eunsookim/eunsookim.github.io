import { ProgressBar } from "@/components/loading/progress-bar"
import { Skeleton } from "@/components/ui/skeleton"

export default function SeriesLoading() {
  return (
    <>
      <ProgressBar />
      <section className="mx-auto max-w-4xl px-4 py-10">
        {/* Back link */}
        <Skeleton className="mb-6 h-4 w-24" />

        {/* Series heading */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>

        {/* Series post items */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-lg border border-border bg-card p-4"
            >
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
