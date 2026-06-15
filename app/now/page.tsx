import { NowPageContent } from "@/components/pages/now-page"
import { getNowData } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const now = getNowData(defaultLocale)

export const metadata = buildPageMetadata({
  title: now.title,
  description: now.description,
  path: "/now",
})

export default function NowPage() {
  return <NowPageContent />
}
