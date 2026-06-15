import { getPageCopy, getProfile } from "@/lib/content/data"
import { createOgImage, ogContentType, ogSize } from "@/lib/og-image"
import { defaultLocale } from "@/lib/i18n/messages"

export const size = ogSize
export const contentType = ogContentType
export const alt = "Sanhuo personal website"
export const runtime = "nodejs"

export default function OpenGraphImage() {
  const pageCopy = getPageCopy(defaultLocale)
  const profile = getProfile(defaultLocale)

  return createOgImage({
    eyebrow: pageCopy.home.hero.eyebrow,
    title: profile.fullName,
    description: pageCopy.home.hero.description,
    tags: pageCopy.home.hero.keywords,
    footer: profile.affiliation,
  })
}
