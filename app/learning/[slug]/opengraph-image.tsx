import { getNoteEntryBySlug } from "@/lib/content/mdx-content"
import { createOgImage, ogContentType, ogSize } from "@/lib/og-image"
import { defaultLocale } from "@/lib/i18n/messages"

export const size = ogSize
export const contentType = ogContentType
export const runtime = "nodejs"

export default async function LearningOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getNoteEntryBySlug(defaultLocale, slug)

  return createOgImage({
    eyebrow: entry?.series ?? "Learning",
    title: entry?.title ?? "Learning notes",
    description: entry?.summary ?? "Research notes, reproductions, concept cards, and ongoing technical study.",
    tags: entry?.tags ?? [],
    footer: entry?.date ?? "Learning",
  })
}
