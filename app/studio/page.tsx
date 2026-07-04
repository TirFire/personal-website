import { cookies } from "next/headers"

import { StudioAccessPage } from "@/components/pages/studio-access-page"
import { StudioPageContent } from "@/components/pages/studio-page"
import { getStudioRuntime } from "@/lib/content/studio"
import { isStudioAuthConfigured, isStudioAuthorizedFromCookies } from "@/lib/studio-auth"

export default async function StudioPage() {
  const cookieStore = await cookies()
  const authConfigured = isStudioAuthConfigured()
  const authorized = await isStudioAuthorizedFromCookies(cookieStore)

  if (!authorized) {
    return <StudioAccessPage authConfigured={authConfigured} />
  }

  return <StudioPageContent authConfigured={authConfigured} runtimeInfo={getStudioRuntime()} />
}
