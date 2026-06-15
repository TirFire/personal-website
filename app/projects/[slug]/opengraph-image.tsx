import { getProjectEntryBySlug } from "@/lib/content/mdx-content"
import { createOgImage, ogContentType, ogSize } from "@/lib/og-image"
import { defaultLocale } from "@/lib/i18n/messages"

export const size = ogSize
export const contentType = ogContentType
export const runtime = "nodejs"

export default async function ProjectOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getProjectEntryBySlug(defaultLocale, slug)

  return createOgImage({
    eyebrow: entry?.category ?? "Projects",
    title: entry?.title ?? "Project archive",
    description: entry?.summary ?? "Research and engineering project archives.",
    tags: entry?.tags ?? [],
    footer: entry?.status ?? "Projects",
  })
}
