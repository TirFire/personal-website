import { NextRequest, NextResponse } from "next/server"

import { renderStudioPreview } from "@/lib/content/studio-preview"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { meta, body: contentBody } = body

    if (!meta || typeof contentBody !== "string") {
      return NextResponse.json({ error: "meta and body are required." }, { status: 400 })
    }

    const html = await renderStudioPreview(meta, contentBody)
    return NextResponse.json({ html })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to render preview." },
      { status: 400 },
    )
  }
}
