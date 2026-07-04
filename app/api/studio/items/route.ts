import { NextResponse } from "next/server"

import { getStudioRuntime, listStudioItems } from "@/lib/content/studio"

export async function GET() {
  try {
    const items = await listStudioItems()
    return NextResponse.json({ items, runtime: getStudioRuntime() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load studio items." },
      { status: 500 },
    )
  }
}
