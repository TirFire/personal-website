import type { Metadata } from "next"
import { ProjectDetailPageContent } from "@/components/pages/project-detail-page"
import { getProjectEntryBySlug } from "@/lib/content/mdx-content"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata, buildProjectJsonLd, jsonLdScript } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const entry = getProjectEntryBySlug(defaultLocale, slug)

  if (!entry) {
    return buildPageMetadata({
      title: "Projects",
      description: "Research and engineering project archives.",
      path: `/projects/${slug}`,
    })
  }

  return buildPageMetadata({
    title: entry.title,
    description: entry.summary,
    path: `/projects/${entry.slug}`,
    imagePath: `/projects/${entry.slug}/opengraph-image`,
    keywords: entry.tags,
    type: "article",
  })
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getProjectEntryBySlug(defaultLocale, slug)

  return (
    <>
      {entry ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(buildProjectJsonLd(entry))} /> : null}
      <ProjectDetailPageContent slug={slug} />
    </>
  )
}
