import type { Metadata } from "next"
import { GalleryDetailPageContent } from "@/components/pages/gallery-detail-page"
import { getGalleryGroupBySlug } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const group = getGalleryGroupBySlug(defaultLocale, slug)

  if (!group) {
    return buildPageMetadata({
      title: "Gallery",
      description: "Themed visual records from study, projects, and life.",
      path: `/gallery/${slug}`,
    })
  }

  return buildPageMetadata({
    title: group.title,
    description: group.description,
    path: `/gallery/${group.slug}`,
    imagePath: `/gallery/${group.slug}/opengraph-image`,
  })
}

export default async function GalleryGroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return <GalleryDetailPageContent slug={slug} />
}
