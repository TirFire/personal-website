import { AnalyticsPageContent } from "@/components/pages/analytics-page"
import { buildPageMetadata } from "@/lib/seo"

export const metadata = buildPageMetadata({
  title: "Analytics",
  description: "Public site counters and analytics viewing guidance.",
  path: "/analytics",
})

export default function AnalyticsPage() {
  return <AnalyticsPageContent />
}
