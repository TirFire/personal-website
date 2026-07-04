import { NextRequest, NextResponse } from "next/server"

import { createStudioItem, deleteStudioItem, isStudioReadonlyError, readStudioItem, updateStudioItem } from "@/lib/content/studio"
import { createDefaultStudioMeta, createStudioSource } from "@/lib/content/studio-source"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get("locale")
  const section = searchParams.get("section")
  const slug = searchParams.get("slug")

  if (!locale || !section || !slug) {
    return NextResponse.json({ error: "locale, section, and slug are required." }, { status: 400 })
  }

  try {
    const item = await readStudioItem(locale, section, slug)
    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load studio item." },
      { status: 404 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale, section, slug, source: providedSource } = body

    if (!locale || !section || !slug) {
      return NextResponse.json({ error: "locale, section, and slug are required." }, { status: 400 })
    }

    const source =
      typeof providedSource === "string"
        ? providedSource
        : createStudioSource(
            createDefaultStudioMeta(section, locale, slug),
            locale === "zh" ? "从这里开始写作。\n" : "Start writing here.\n",
          )

    await createStudioItem(locale, section, slug, source)
    const item = await readStudioItem(locale, section, slug)
    return NextResponse.json({ ok: true, ...item })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create studio item." },
      { status: isStudioReadonlyError(error) ? 409 : 400 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale, section, slug, meta, body: contentBody } = body

    if (!locale || !section || !slug || !meta || typeof contentBody !== "string") {
      return NextResponse.json({ error: "locale, section, slug, meta, and body are required." }, { status: 400 })
    }

    const source = createStudioSource(meta, contentBody)
    const result = await updateStudioItem(locale, section, slug, meta, source)
    const item = await readStudioItem(result.locale, result.section, result.slug)
    return NextResponse.json({ ok: true, regenerated: result.regenerated, ...item })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update studio item." },
      { status: isStudioReadonlyError(error) ? 409 : 400 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale")
    const section = searchParams.get("section")
    const slug = searchParams.get("slug")

    if (!locale || !section || !slug) {
      return NextResponse.json({ error: "locale, section, and slug are required." }, { status: 400 })
    }

    await deleteStudioItem(locale, section, slug)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete studio item." },
      { status: isStudioReadonlyError(error) ? 409 : 400 },
    )
  }
}
