import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { isStudioAuthorized, studioSessionCookieName } from "@/lib/studio-auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const shouldProtectStudioApi = pathname.startsWith("/api/studio/") && pathname !== "/api/studio/auth"

  // The /studio page renders its own access screen server-side.
  // Only the mutation/data APIs need middleware-level blocking.
  if (!shouldProtectStudioApi) {
    return NextResponse.next()
  }

  const sessionValue = request.cookies.get(studioSessionCookieName)?.value ?? null
  const authorized = await isStudioAuthorized(sessionValue)

  if (authorized) {
    return NextResponse.next()
  }

  return NextResponse.json({ error: "Unauthorized studio access." }, { status: 401 })
}

export const config = {
  matcher: ["/api/studio/:path*"],
}
