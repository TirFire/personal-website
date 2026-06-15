import { getGalleryGroupBySlug } from "@/lib/content/data"
import { createOgImage, ogContentType, ogSize } from "@/lib/og-image"
import { defaultLocale } from "@/lib/i18n/messages"

export const size = ogSize
export const contentType = ogContentType
export const runtime = "nodejs"

export default async function GalleryOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const group = getGalleryGroupBySlug(defaultLocale, slug)

  return createOgImage({
    eyebrow: "Gallery",
    title: group?.title ?? "Gallery",
    description: group?.description ?? "Themed visual records from study, projects, and life.",
    footer: group?.caption ?? "Gallery",
  })
}
