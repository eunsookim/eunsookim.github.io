export function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[60svh] flex-col items-center justify-center gap-8"
    >
      <div className="relative flex size-16 items-center justify-center">
        {/* Outer ring */}
        <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-primary border-b-primary" />
        {/* Inner ring */}
        <div className="absolute inset-[8px] animate-spin-reverse rounded-full border-2 border-transparent border-t-primary/60 border-b-primary/60" />
        {/* Center pulse dot */}
        <div className="size-2 animate-pulse-dot rounded-full bg-primary" />
      </div>

      <span className="animate-fade-text font-mono text-sm font-bold tracking-widest text-primary">
        SOLVLOG
      </span>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
