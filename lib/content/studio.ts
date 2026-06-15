import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { compile } from "@mdx-js/mdx"
import { mdxCompileOptions } from "./mdx-options.mjs"

import {
  createStudioSource,
  parseStudioSource,
  type ImportedStudioReference,
  type StudioLocale,
  type StudioMeta,
  type StudioSection,
} from "@/lib/content/studio-source"

export type { StudioLocale, StudioMeta, StudioSection } from "@/lib/content/studio-source"
export type StudioDataKey =
  | "profile"
  | "social"
  | "research-areas"
  | "now"
  | "updates"
  | "output"
  | "cv"
  | "gallery"
  | "friends"
  | "contact"
  | "site-config"

export type StudioDataValue = Record<string, unknown> | Array<Record<string, unknown>>

export type StudioItem = {
  locale: StudioLocale
  section: StudioSection
  slug: string
  title: string
  draft: boolean
}

export type StudioReadItem = StudioItem & {
  meta: StudioMeta
  body: string
  source: string
}

export type StudioDataItem = {
  key: StudioDataKey
  locale: StudioLocale
  title: string
  summary: string
}

export type StudioReadDataItem = StudioDataItem & {
  value: StudioDataValue
  source: string
}

const contentRoot = path.join(process.cwd(), "content")
const dataRoot = path.join(contentRoot, "data")
const studioLocales: StudioLocale[] = ["zh", "en"]
const studioSections: StudioSection[] = ["blog", "notes", "projects"]
const studioDataKeys: StudioDataKey[] = [
  "profile",
  "social",
  "research-areas",
  "now",
  "updates",
  "output",
  "cv",
  "gallery",
  "friends",
  "contact",
  "site-config",
]

const studioDataFileMap: Record<StudioDataKey, string> = {
  profile: "profile.json",
  social: "social.json",
  "research-areas": "research-areas.json",
  now: "now.json",
  updates: "updates.json",
  output: "output.json",
  cv: "cv.json",
  gallery: "gallery.json",
  friends: "friends.json",
  contact: "contact.json",
  "site-config": "site-config.json",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function assertLocale(value: string): StudioLocale {
  if (value === "zh" || value === "en") return value
  throw new Error(`Unsupported locale: ${value}`)
}

function assertSection(value: string): StudioSection {
  if (value === "blog" || value === "notes" || value === "projects") return value
  throw new Error(`Unsupported section: ${value}`)
}

function assertDataKey(value: string): StudioDataKey {
  if (studioDataKeys.includes(value as StudioDataKey)) return value as StudioDataKey
  throw new Error(`Unsupported data key: ${value}`)
}

function getStudioItemPath(locale: StudioLocale, section: StudioSection, slug: string) {
  return path.join(contentRoot, locale, section, `${slug}.mdx`)
}

function getStudioDataPath(key: StudioDataKey) {
  return path.join(dataRoot, studioDataFileMap[key])
}

function toStudioItem(locale: StudioLocale, section: StudioSection, slug: string, meta: StudioMeta): StudioItem {
  return {
    locale,
    section,
    slug,
    title: typeof meta.title === "string" && meta.title.trim() ? meta.title : slug,
    draft: Boolean(meta.draft),
  }
}

async function readStudioSource(locale: StudioLocale, section: StudioSection, slug: string) {
  const filePath = getStudioItemPath(locale, section, slug)
  const source = await fs.readFile(filePath, "utf8")
  const { meta, body } = parseStudioSource(source)

  return {
    filePath,
    source,
    meta,
    body,
  }
}

async function runContentGenerate(excludedContentKeys: string[] = []) {
  const command = process.platform === "win32" ? "cmd.exe" : "pnpm"
  const args = process.platform === "win32" ? ["/c", "pnpm", "content:generate"] : ["content:generate"]

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...(excludedContentKeys.length > 0 ? { CONTENT_INDEX_EXCLUDE: excludedContentKeys.join(",") } : {}),
      },
      stdio: "pipe",
    })

    let stderr = ""

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(stderr.trim() || "Failed to regenerate the content index."))
    })
  })
}

function formatMdxCompileError(error: unknown) {
  if (error && typeof error === "object" && "line" in error && "column" in error) {
    const line = typeof error.line === "number" ? error.line : "?"
    const column = typeof error.column === "number" ? error.column : "?"
    const reason =
      typeof (error as { reason?: unknown }).reason === "string"
        ? (error as { reason: string }).reason
        : error instanceof Error
          ? error.message
          : "Invalid MDX content."

    return `MDX validation failed at line ${line}, column ${column}: ${reason}`
  }

  return error instanceof Error ? error.message : "Invalid MDX content."
}

async function validateStudioSource(source: string) {
  try {
    await compile(source, mdxCompileOptions)
  } catch (error) {
    throw new Error(formatMdxCompileError(error))
  }
}

export function buildStudioSource(meta: StudioMeta, body: string) {
  return createStudioSource(meta, body)
}

export async function listStudioItems() {
  const items: StudioItem[] = []

  for (const locale of studioLocales) {
    for (const section of studioSections) {
      const sectionPath = path.join(contentRoot, locale, section)
      const entries = await fs.readdir(sectionPath, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue

        const slug = entry.name.replace(/\.mdx$/, "")
        const source = await fs.readFile(path.join(sectionPath, entry.name), "utf8")
        const { meta } = parseStudioSource(source)
        items.push(toStudioItem(locale, section, slug, meta))
      }
    }
  }

  return items.sort((left, right) => {
    if (left.section !== right.section) return studioSections.indexOf(left.section) - studioSections.indexOf(right.section)
    if (left.locale !== right.locale) return studioLocales.indexOf(left.locale) - studioLocales.indexOf(right.locale)
    return left.title.localeCompare(right.title)
  })
}

export async function listStudioReferences(): Promise<ImportedStudioReference[]> {
  const items = await listStudioItems()

  return items.map((item) => ({
    locale: item.locale,
    section: item.section,
    slug: item.slug,
    title: item.title,
  }))
}

export async function readStudioItem(localeValue: string, sectionValue: string, slug: string): Promise<StudioReadItem> {
  const locale = assertLocale(localeValue)
  const section = assertSection(sectionValue)
  const { meta, body, source } = await readStudioSource(locale, section, slug)

  return {
    ...toStudioItem(locale, section, slug, meta),
    meta,
    body,
    source,
  }
}

export async function createStudioItem(localeValue: string, sectionValue: string, slug: string, source: string) {
  const locale = assertLocale(localeValue)
  const section = assertSection(sectionValue)
  const filePath = getStudioItemPath(locale, section, slug)

  await validateStudioSource(source)
  await fs.mkdir(path.dirname(filePath), { recursive: true })

  try {
    await fs.access(filePath)
    throw new Error("A file with this slug already exists.")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }
  }

  await fs.writeFile(filePath, source, "utf8")
  await runContentGenerate()
}

export async function updateStudioItem(localeValue: string, sectionValue: string, slug: string, meta: StudioMeta, source: string) {
  const locale = assertLocale(localeValue)
  const section = assertSection(sectionValue)
  const nextLocale = assertLocale(typeof meta.locale === "string" ? meta.locale : locale)
  const nextSlug = typeof meta.slug === "string" && meta.slug.trim() ? meta.slug.trim() : slug

  const currentPath = getStudioItemPath(locale, section, slug)
  const nextPath = getStudioItemPath(nextLocale, section, nextSlug)
  const moved = currentPath !== nextPath

  if (moved) {
    try {
      await fs.access(nextPath)
      throw new Error("A file with the updated locale and slug already exists.")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error
      }
    }
  }

  await validateStudioSource(source)
  await fs.mkdir(path.dirname(nextPath), { recursive: true })
  await fs.writeFile(nextPath, source, "utf8")

  if (moved) {
    await fs.unlink(currentPath)
  }

  await runContentGenerate()

  return {
    locale: nextLocale,
    section,
    slug: nextSlug,
    regenerated: moved,
  }
}

export async function deleteStudioItem(localeValue: string, sectionValue: string, slug: string) {
  const locale = assertLocale(localeValue)
  const section = assertSection(sectionValue)
  const filePath = getStudioItemPath(locale, section, slug)

  await fs.access(filePath)

  try {
    await runContentGenerate([`${locale}:${section}:${slug}`])
    await fs.unlink(filePath)
  } catch (error) {
    await runContentGenerate().catch(() => undefined)
    throw error
  }
}

function getStudioDataSummary(key: StudioDataKey, locale: StudioLocale, value: unknown): StudioDataItem {
  if (key === "profile" && isRecord(value)) {
    return {
      key,
      locale,
      title: typeof value.displayName === "string" ? value.displayName : "Profile",
      summary: typeof value.role === "string" ? value.role : "",
    }
  }

  if (key === "social" && isRecord(value)) {
    const channelCount = Array.isArray(value.contactChannels) ? value.contactChannels.length : 0
    return {
      key,
      locale,
      title: "Social",
      summary: `${channelCount} channels`,
    }
  }

  if (key === "research-areas" && Array.isArray(value)) {
    return {
      key,
      locale,
      title: "Research areas",
      summary: `${value.length} items`,
    }
  }

  if (key === "now" && isRecord(value)) {
    return {
      key,
      locale,
      title: typeof value.title === "string" ? value.title : "Now",
      summary: typeof value.description === "string" ? value.description : "",
    }
  }

  if (key === "updates" && isRecord(value)) {
    const itemCount = Array.isArray(value.items) ? value.items.length : 0
    return {
      key,
      locale,
      title: typeof value.title === "string" ? value.title : "Updates",
      summary: `${itemCount} items`,
    }
  }

  if (key === "output" && isRecord(value)) {
    const sectionCount = Array.isArray(value.sections) ? value.sections.length : 0
    return {
      key,
      locale,
      title: typeof value.title === "string" ? value.title : "Output",
      summary: `${sectionCount} sections`,
    }
  }

  if (key === "cv" && isRecord(value)) {
    const sectionCount = Array.isArray(value.sections) ? value.sections.length : 0
    return {
      key,
      locale,
      title: typeof value.title === "string" ? value.title : "CV",
      summary: `${sectionCount} sections`,
    }
  }

  if (key === "gallery" && isRecord(value)) {
    const groupCount = Array.isArray(value.groups) ? value.groups.length : 0
    return {
      key,
      locale,
      title: typeof value.title === "string" ? value.title : "Gallery",
      summary: `${groupCount} groups`,
    }
  }

  if (key === "friends" && isRecord(value)) {
    const itemCount = Array.isArray(value.items) ? value.items.length : 0
    return {
      key,
      locale,
      title: typeof value.title === "string" ? value.title : "Friends",
      summary: `${itemCount} links`,
    }
  }

  if (key === "contact" && isRecord(value)) {
    const itemCount = Array.isArray(value.collaboration) ? value.collaboration.length : 0
    return {
      key,
      locale,
      title: "Contact",
      summary: `${itemCount} collaboration items`,
    }
  }

  if (key === "site-config" && isRecord(value)) {
    const navCount = isRecord(value.navigation) && Array.isArray(value.navigation.primaryNav) ? value.navigation.primaryNav.length : 0
    return {
      key,
      locale,
      title: isRecord(value.metadata) && typeof value.metadata.title === "string" ? value.metadata.title : "Site config",
      summary: `${navCount} primary nav items`,
    }
  }

  return {
    key,
    locale,
    title: key,
    summary: "",
  }
}

async function readStudioDataFile(key: StudioDataKey) {
  const filePath = getStudioDataPath(key)
  const source = await fs.readFile(filePath, "utf8")
  const data = JSON.parse(source) as Record<StudioLocale, StudioDataValue>

  return {
    filePath,
    source,
    data,
  }
}

function sanitizeGalleryData(value: StudioDataValue): StudioDataValue {
  if (!isRecord(value) || !Array.isArray(value.groups)) return value

  return {
    ...value,
    groups: value.groups.map((group) => {
      if (!isRecord(group)) return group

      const validPhotos = Array.isArray(group.photos)
        ? group.photos.filter((photo) => isRecord(photo) && typeof photo.src === "string" && photo.src.trim().length > 0)
        : []
      const cover = typeof group.cover === "string" && validPhotos.some((photo) => photo.src === group.cover) ? group.cover : ""

      return {
        ...group,
        cover,
        photos: validPhotos.map((photo) => ({
          ...photo,
          videoSrc: typeof photo.videoSrc === "string" ? photo.videoSrc.trim() : "",
        })),
      }
    }),
  }
}

export async function listStudioDataItems() {
  const items: StudioDataItem[] = []

  for (const key of studioDataKeys) {
    const { data } = await readStudioDataFile(key)

    for (const locale of studioLocales) {
      items.push(getStudioDataSummary(key, locale, data[locale]))
    }
  }

  return items
}

export async function readStudioDataItem(keyValue: string, localeValue: string): Promise<StudioReadDataItem> {
  const key = assertDataKey(keyValue)
  const locale = assertLocale(localeValue)
  const { data } = await readStudioDataFile(key)
  const value = data[locale]

  return {
    ...getStudioDataSummary(key, locale, value),
    value,
    source: `${JSON.stringify(value, null, 2)}\n`,
  }
}

export async function updateStudioDataItem(keyValue: string, localeValue: string, value: StudioDataValue) {
  const key = assertDataKey(keyValue)
  const locale = assertLocale(localeValue)
  const { filePath, data } = await readStudioDataFile(key)

  data[locale] = key === "gallery" ? sanitizeGalleryData(value) : value
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8")

  return readStudioDataItem(key, locale)
}
