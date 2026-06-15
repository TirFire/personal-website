import { Suspense } from "react"
import { LearningPageContent } from "@/components/pages/learning-page"
import { getPageCopy } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const pageCopy = getPageCopy(defaultLocale)

export const metadata = buildPageMetadata({
  title: pageCopy.learning.title,
  description: pageCopy.learning.description,
  path: "/learning",
})

export default function LearningPage() {
  return (
    <Suspense>
      <LearningPageContent />
    </Suspense>
  )
}
