import { ProgressBar } from "@/components/loading/progress-bar"
import { SkeletonBlogPost } from "@/components/loading/skeleton-blog-post"

export default function BlogPostLoading() {
  return (
    <>
      <ProgressBar />
      <SkeletonBlogPost />
    </>
  )
}
