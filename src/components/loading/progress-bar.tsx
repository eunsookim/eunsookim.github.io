export function ProgressBar() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed top-0 right-0 left-0 z-[60] h-0.5 overflow-hidden bg-primary/20"
    >
      <div
        className="h-full w-1/4 bg-primary"
        style={{ animation: "progress-indeterminate 2s ease-in-out infinite" }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
