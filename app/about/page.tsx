import { AboutPageContent } from "@/components/pages/about-page"
import { getPageCopy } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const pageCopy = getPageCopy(defaultLocale)

export const metadata = buildPageMetadata({
  title: pageCopy.about.title,
  description: pageCopy.about.intro,
  path: "/about",
})

export default function AboutPage() {
  return <AboutPageContent />
}
