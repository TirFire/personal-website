import { HomePageContent } from "@/components/pages/home-page"
import { getPageCopy } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const pageCopy = getPageCopy(defaultLocale)

export const metadata = buildPageMetadata({
  description: pageCopy.home.hero.description,
  path: "/",
})

export default function HomePage() {
  return <HomePageContent />
}
