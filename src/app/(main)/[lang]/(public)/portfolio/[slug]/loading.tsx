import { ProgressBar } from "@/components/loading/progress-bar"
import { SkeletonPortfolioDetail } from "@/components/loading/skeleton-portfolio-detail"

export default function PortfolioDetailLoading() {
  return (
    <>
      <ProgressBar />
      <SkeletonPortfolioDetail />
    </>
  )
}
