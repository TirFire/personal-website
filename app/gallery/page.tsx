import { GalleryPageContent } from "@/components/pages/gallery-page"
import { getGalleryData } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const gallery = getGalleryData(defaultLocale)

export const metadata = buildPageMetadata({
  title: gallery.title,
  description: gallery.description,
  path: "/gallery",
})

export default function GalleryPage() {
  return <GalleryPageContent />
}
