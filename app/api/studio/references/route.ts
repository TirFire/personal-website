import { NextResponse } from "next/server"

import { getStudioRuntime, listStudioReferences } from "@/lib/content/studio"

export async function GET() {
  try {
    const references = await listStudioReferences()
    return NextResponse.json({ references, runtime: getStudioRuntime() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load studio references." },
      { status: 500 },
    )
  }
}
