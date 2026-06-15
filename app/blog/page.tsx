import { Suspense } from "react"
import { BlogPageContent } from "@/components/pages/blog-page"
import { getPageCopy } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const pageCopy = getPageCopy(defaultLocale)

export const metadata = buildPageMetadata({
  title: pageCopy.blog.title,
  description: pageCopy.blog.description,
  path: "/blog",
})

export default function BlogPage() {
  return (
    <Suspense>
      <BlogPageContent />
    </Suspense>
  )
}
