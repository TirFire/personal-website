import { OutputPageContent } from "@/components/pages/output-page"
import { getOutputData } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const output = getOutputData(defaultLocale)

export const metadata = buildPageMetadata({
  title: output.title,
  description: output.description,
  path: "/output",
})

export default function OutputPage() {
  return <OutputPageContent />
}
