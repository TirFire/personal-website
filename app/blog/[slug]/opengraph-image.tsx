import { getBlogEntryBySlug } from "@/lib/content/mdx-content"
import { createOgImage, ogContentType, ogSize } from "@/lib/og-image"
import { defaultLocale } from "@/lib/i18n/messages"

export const size = ogSize
export const contentType = ogContentType
export const runtime = "nodejs"

export default async function BlogOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getBlogEntryBySlug(defaultLocale, slug)

  return createOgImage({
    eyebrow: entry?.category ?? "Blog",
    title: entry?.title ?? "Blog",
    description: entry?.excerpt ?? "Research writing, technical notes, and project retrospectives.",
    tags: entry?.tags ?? [],
    footer: entry?.readingTime ?? "Blog",
  })
}
