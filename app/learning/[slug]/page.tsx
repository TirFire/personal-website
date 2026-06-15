import type { Metadata } from "next"
import { NoteDetailPageContent } from "@/components/pages/note-detail-page"
import { getNoteEntryBySlug } from "@/lib/content/mdx-content"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildNoteJsonLd, buildPageMetadata, jsonLdScript } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const entry = getNoteEntryBySlug(defaultLocale, slug)

  if (!entry) {
    return buildPageMetadata({
      title: "Learning",
      description: "Research notes, reproductions, and ongoing technical study.",
      path: `/learning/${slug}`,
    })
  }

  return buildPageMetadata({
    title: entry.title,
    description: entry.summary,
    path: `/learning/${entry.slug}`,
    imagePath: `/learning/${entry.slug}/opengraph-image`,
    keywords: entry.tags,
    type: "article",
    publishedTime: entry.date,
  })
}

export default async function LearningDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getNoteEntryBySlug(defaultLocale, slug)

  return (
    <>
      {entry ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(buildNoteJsonLd(entry))} /> : null}
      <NoteDetailPageContent slug={slug} />
    </>
  )
}
