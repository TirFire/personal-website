import { FriendsPageContent } from "@/components/pages/friends-page"
import { getFriendsData } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildPageMetadata } from "@/lib/seo"

const friends = getFriendsData(defaultLocale)

export const metadata = buildPageMetadata({
  title: friends.title,
  description: friends.description,
  path: "/friends",
})

export default function FriendsPage() {
  return <FriendsPageContent />
}
