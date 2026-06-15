import { ProjectsPageContent } from "@/components/pages/projects-page"
import { getPageCopy } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const pageCopy = getPageCopy(defaultLocale)

export const metadata = buildPageMetadata({
  title: pageCopy.projects.title,
  description: pageCopy.projects.description,
  path: "/projects",
})

export default function ProjectsPage() {
  return <ProjectsPageContent />
}
