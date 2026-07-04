import path from "node:path"
import { promises as fs } from "node:fs"

import { NextRequest, NextResponse } from "next/server"
import { getStudioRuntime } from "@/lib/content/studio"
import { uploadGithubBinaryFile } from "@/lib/content/studio-github"

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

function sanitizeFileName(value: string) {
  const extension = path.extname(value).toLowerCase()
  const baseName = path.basename(value, extension)
  const safeBase = sanitizeSegment(baseName) || "asset"
  const safeExtension = extension.replace(/[^a-z0-9.]/g, "") || ".png"
  return `${safeBase}${safeExtension}`
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(file.name)
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg|avif|heic)$/i.test(file.name)
}

export async function POST(request: NextRequest) {
  try {
    const runtime = getStudioRuntime()

    if (!runtime.writeEnabled) {
      return NextResponse.json(
        {
          error:
            "The deployed Studio is currently read-only. Upload assets from the local workspace Studio, or add a remote asset backend before enabling web uploads.",
        },
        { status: 409 },
      )
    }

    const formData = await request.formData()
    const locale = sanitizeSegment(String(formData.get("locale") ?? ""))
    const section = sanitizeSegment(String(formData.get("section") ?? ""))
    const slug = sanitizeSegment(String(formData.get("slug") ?? ""))

    if (!locale || !section || !slug) {
      return NextResponse.json({ error: "locale, section, and slug are required." }, { status: 400 })
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && (isImageFile(entry) || isVideoFile(entry)))
    if (files.length === 0) {
      return NextResponse.json({ error: "At least one image or video file is required." }, { status: 400 })
    }

    const usedNames = new Set<string>()
    const assets = []

    if (runtime.backend === "filesystem") {
      const targetDirectory = path.join(process.cwd(), "public", "uploads", "studio", section, locale, slug)
      await fs.mkdir(targetDirectory, { recursive: true })

      for (const file of files) {
        const initialName = sanitizeFileName(file.name)
        const extension = path.extname(initialName)
        const baseName = path.basename(initialName, extension)
        let nextName = initialName
        let counter = 2

        while (usedNames.has(nextName)) {
          nextName = `${baseName}-${counter}${extension}`
          counter += 1
        }

        usedNames.add(nextName)

        const filePath = path.join(targetDirectory, nextName)
        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(filePath, buffer)

        assets.push({
          name: file.name,
          url: `/uploads/studio/${section}/${locale}/${slug}/${nextName}`,
        })
      }

      return NextResponse.json({ ok: true, assets })
    }

    for (const file of files) {
      const initialName = sanitizeFileName(file.name)
      const extension = path.extname(initialName)
      const baseName = path.basename(initialName, extension)
      let nextName = initialName
      let counter = 2

      while (usedNames.has(nextName)) {
        nextName = `${baseName}-${counter}${extension}`
        counter += 1
      }

      usedNames.add(nextName)

      const buffer = Buffer.from(await file.arrayBuffer())
      const repoPath = `public/uploads/studio/${section}/${locale}/${slug}/${nextName}`

      await uploadGithubBinaryFile(repoPath, buffer, `studio: upload ${repoPath}`)

      assets.push({
        name: file.name,
        url: `/uploads/studio/${section}/${locale}/${slug}/${nextName}`,
      })
    }

    return NextResponse.json({ ok: true, assets })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload studio assets." },
      { status: 400 },
    )
  }
}
