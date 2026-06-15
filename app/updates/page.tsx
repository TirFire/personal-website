import { UpdatesPageContent } from "@/components/pages/updates-page"
import { getUpdatesData } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const updates = getUpdatesData(defaultLocale)

export const metadata = buildPageMetadata({
  title: updates.title,
  description: updates.description,
  path: "/updates",
})

export default function UpdatesPage() {
  return <UpdatesPageContent />
}
