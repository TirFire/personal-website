import { NextRequest, NextResponse } from "next/server"

import { getStudioRuntime, isStudioReadonlyError, listStudioDataItems, readStudioDataItem, updateStudioDataItem } from "@/lib/content/studio"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const locale = searchParams.get("locale")

  try {
    if (key && locale) {
      const item = await readStudioDataItem(key, locale)
      return NextResponse.json({ ...item, runtime: getStudioRuntime() })
    }

    const items = await listStudioDataItems()
    return NextResponse.json({ items, runtime: getStudioRuntime() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load studio data." },
      { status: 400 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, locale, value } = body

    if (!key || !locale || typeof value === "undefined") {
      return NextResponse.json({ error: "key, locale, and value are required." }, { status: 400 })
    }

    const item = await updateStudioDataItem(key, locale, value)
    return NextResponse.json({ ok: true, ...item })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update studio data." },
      { status: isStudioReadonlyError(error) ? 409 : 400 },
    )
  }
}
