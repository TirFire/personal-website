import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { isStudioAuthorized, studioSessionCookieName } from "@/lib/studio-auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const shouldProtectStudio =
    pathname === "/studio" ||
    pathname.startsWith("/studio/") ||
    (pathname.startsWith("/api/studio/") && pathname !== "/api/studio/auth")

  if (!shouldProtectStudio) {
    return NextResponse.next()
  }

  const sessionValue = request.cookies.get(studioSessionCookieName)?.value ?? null
  const authorized = await isStudioAuthorized(sessionValue)

  if (authorized) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/studio/")) {
    return NextResponse.json({ error: "Unauthorized studio access." }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/studio", request.url))
}

export const config = {
  matcher: ["/studio/:path*", "/api/studio/:path*"],
}
