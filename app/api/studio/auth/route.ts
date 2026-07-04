import { NextRequest, NextResponse } from "next/server"

import {
  createStudioSessionValue,
  isStudioAuthConfigured,
  isStudioOpenInCurrentEnvironment,
  studioSessionCookieName,
  verifyStudioPassword,
} from "@/lib/studio-auth"

export async function POST(request: NextRequest) {
  if (!isStudioAuthConfigured() && isStudioOpenInCurrentEnvironment()) {
    return NextResponse.json({ ok: true })
  }

  try {
    const body = await request.json()
    const password = typeof body.password === "string" ? body.password : ""
    const valid = await verifyStudioPassword(password)

    if (!valid) {
      return NextResponse.json({ error: "Invalid studio password." }, { status: 401 })
    }

    const sessionValue = await createStudioSessionValue(password)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(studioSessionCookieName, sessionValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to authenticate studio access." },
      { status: 400 },
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(studioSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return response
}
