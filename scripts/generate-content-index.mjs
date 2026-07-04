import { promises as fs } from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { compile } from "@mdx-js/mdx"
import { z } from "zod"
import { mdxCompileOptions } from "../lib/content/mdx-options.mjs"

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, "content")
const outputFile = path.join(projectRoot, "lib", "content", "generated-content-index.ts")
const studioOutputFile = path.join(projectRoot, "lib", "content", "generated-studio-index.ts")
const referenceMapFile = path.join(projectRoot, "lib", "content", "generated-reference-map.json")

const locales = ["en", "zh"]
const sections = ["blog", "notes", "projects"]
const excludedContentKeys = new Set(
  (process.env.CONTENT_INDEX_EXCLUDE ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
)

const localeSchema = z.enum(["en", "zh"])

const actionLinkSchema = z.object({
  href: z.string().min(1),
  label: z.string().min(1),
  external: z.boolean().optional(),
})

const schemaBySection = {
  blog: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    category: z.string().min(1),
    date: z.string().min(1),
    readingTime: z.string().min(1),
    excerpt: z.string().min(1),
    cover: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).min(1),
    draft: z.boolean().optional(),
    locale: localeSchema,
  }),
  notes: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    series: z.string().min(1),
    date: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    draft: z.boolean().optional(),
    locale: localeSchema,
  }),
  projects: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    period: z.string().min(1),
    category: z.string().min(1),
    status: z.string().min(1),
    role: z.string().min(1).optional(),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    links: z.array(actionLinkSchema).optional(),
    draft: z.boolean().optional(),
    locale: localeSchema,
  }),
}

function toIdentifier(filePath) {
  const normalized = filePath.replace(/\\/g, "/").replace(/[^a-zA-Z0-9]/g, "_")
  const identifier = normalized.replace(/_+/g, "_").replace(/^_+|_+$/g, "")
  return /^[A-Za-z_]/.test(identifier) ? identifier : `content_${identifier}`
}

async function listMdxFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right))
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return []
    }

    throw error
  }
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

function extractMetaBlock(source, filePath) {
  const marker = "export const meta ="
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Missing meta export in ${filePath}`)
  }

  const objectStart = source.indexOf("{", markerIndex)
  if (objectStart === -1) {
    throw new Error(`Could not find meta object in ${filePath}`)
  }

  let depth = 0
  let objectEnd = -1

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index]
    if (char === "{") depth += 1
    if (char === "}") {
      depth -= 1
      if (depth === 0) {
        objectEnd = index
        break
      }
    }
  }

  if (objectEnd === -1) {
    throw new Error(`Could not determine meta object boundary in ${filePath}`)
  }

  return {
    literal: source.slice(objectStart, objectEnd + 1),
    endIndex: objectEnd + 1,
  }
}

function extractMetaSource(source, filePath) {
  return extractMetaBlock(source, filePath).literal
}

function extractContentBody(source, filePath) {
  return source.slice(extractMetaBlock(source, filePath).endIndex).trim()
}

async function parseMeta(filePath) {
  const source = await fs.readFile(filePath, "utf8")
  const metaSource = extractMetaSource(source, filePath)
  return vm.runInNewContext(`(${metaSource})`, {}, { timeout: 1000 })
}

function formatContentError(filePath, error) {
  if (error && typeof error === "object" && "line" in error && "column" in error) {
    const line = typeof error.line === "number" ? error.line : "?"
    const column = typeof error.column === "number" ? error.column : "?"
    const reason = typeof error.message === "string" ? error.message : "Unknown content error"
    return `${filePath}:${line}:${column} ${reason}`
  }

  return `${filePath}: ${error instanceof Error ? error.message : "Unknown content error"}`
}

function slugifyReference(value) {
  return value
    .trim()
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5/]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeReference(value) {
  const cleaned = value.trim().replace(/^<|>$/g, "").replace(/\.[^.]+$/, "")

  try {
    return decodeURIComponent(cleaned).toLowerCase()
  } catch {
    return cleaned.toLowerCase()
  }
}

function normalizeReferenceCandidates(value) {
  const normalized = normalizeReference(value).replace(/\\/g, "/")
  const basename = normalized.split("/").filter(Boolean).at(-1) ?? normalized

  return new Set([normalized, basename, slugifyReference(normalized), slugifyReference(basename)].filter(Boolean))
}

function stripCodeSegments(source) {
  return source.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`/g, "")
}

function extractNoteReferenceTargets(source) {
  const targets = []
  const stripped = stripCodeSegments(source)

  for (const match of stripped.matchAll(/(?<!!)\[\[([^[\]]+?)\]\]/g)) {
    const [rawTarget, rawAlias = ""] = String(match[1]).split("|")
    const target = rawTarget.split("#")[0]?.trim()
    if (target) {
      targets.push({
        target,
        label: rawAlias.trim() || target,
        kind: "wiki",
      })
    }
  }

  for (const match of stripped.matchAll(/\[[^\]]+\]\(([^)\n]+)\)/g)) {
    const rawTarget = String(match[1]).trim()
    const learningMatch = rawTarget.match(/(?:^|\/)learning\/([^/?#)]+)/)
    if (learningMatch?.[1]) {
      targets.push({
        target: learningMatch[1],
        label: learningMatch[1],
        kind: "markdown",
      })
    }
  }

  return targets
}

function isExcludedContent(locale, section, fileName, meta) {
  const fileSlug = fileName.replace(/\.mdx$/, "")
  const metaSlug = typeof meta.slug === "string" ? meta.slug : fileSlug

  return (
    excludedContentKeys.has(`${locale}:${section}:${fileSlug}`) ||
    excludedContentKeys.has(`${locale}:${section}:${metaSlug}`) ||
    excludedContentKeys.has(`${locale}/${section}/${fileName}`)
  )
}

function createNoteRelations(records) {
  const notesByLocale = new Map()

  for (const record of records) {
    if (record.section !== "notes") continue

    const notes = notesByLocale.get(record.locale) ?? []
    notes.push(record)
    notesByLocale.set(record.locale, notes)
  }

  return Object.fromEntries(
    locales.map((locale) => {
      const notes = notesByLocale.get(locale) ?? []
      const candidates = new Map()

      for (const note of notes) {
        const values = [
          note.meta.slug,
          note.meta.title,
          slugifyReference(note.meta.title),
          slugifyReference(note.meta.slug),
        ]

        for (const value of values) {
          for (const candidate of normalizeReferenceCandidates(value)) {
            if (!candidates.has(candidate)) {
              candidates.set(candidate, note.meta.slug)
            }
          }
        }
      }

      const relationMap = Object.fromEntries(
        notes.map((note) => [
          note.meta.slug,
          {
            outgoing: [],
            backlinks: [],
          },
        ]),
      )

      for (const note of notes) {
        const outgoing = new Set()
        for (const reference of extractNoteReferenceTargets(note.body)) {
          for (const candidate of normalizeReferenceCandidates(reference.target)) {
            const resolvedSlug = candidates.get(candidate)
            if (resolvedSlug && resolvedSlug !== note.meta.slug) {
              outgoing.add(resolvedSlug)
              break
            }
          }
        }

        relationMap[note.meta.slug].outgoing = Array.from(outgoing).sort()
      }

      for (const [sourceSlug, relation] of Object.entries(relationMap)) {
        for (const targetSlug of relation.outgoing) {
          relationMap[targetSlug]?.backlinks.push(sourceSlug)
        }
      }

      for (const relation of Object.values(relationMap)) {
        relation.backlinks = Array.from(new Set(relation.backlinks)).sort()
      }

      return [locale, relationMap]
    }),
  )
}

function createReferenceMap(records) {
  const map = Object.fromEntries(locales.map((locale) => [locale, {}]))

  for (const record of records) {
    const publicBase = record.section === "notes" ? "learning" : record.section
    const href = `/${publicBase}/${record.meta.slug}`
    const values = [
      record.meta.slug,
      record.meta.title,
      slugifyReference(record.meta.title),
      slugifyReference(record.meta.slug),
    ]

    for (const value of values) {
      for (const candidate of normalizeReferenceCandidates(value)) {
        if (!map[record.locale][candidate]) {
          map[record.locale][candidate] = href
        }
      }
    }
  }

  return map
}

async function main() {
  const imports = []
  const records = []
  const seenSlugs = new Map()
  const invalidEntries = []

  for (const locale of locales) {
    for (const section of sections) {
      const sectionDir = path.join(contentRoot, locale, section)
      const fileNames = await listMdxFiles(sectionDir)

      for (const fileName of fileNames) {
        const modulePath = path.join(sectionDir, fileName)
        const relativeImportPath = `@/content/${locale}/${section}/${fileName}`
        const baseIdentifier = toIdentifier(`${locale}_${section}_${fileName.replace(/\.mdx$/, "")}`)
        const contentIdentifier = `${baseIdentifier}Content`
        const metaIdentifier = `${baseIdentifier}Meta`

        try {
          const source = await fs.readFile(modulePath, "utf8")
          const meta = await parseMeta(modulePath)

          schemaBySection[section].parse(meta)
          await compile(source, mdxCompileOptions)

          if (isExcludedContent(locale, section, fileName, meta)) {
            continue
          }

          const slugKey = `${locale}:${section}:${meta.slug}`
          const existingPath = seenSlugs.get(slugKey)
          if (existingPath) {
            throw new Error(`Duplicate slug "${meta.slug}" found in ${existingPath} and ${modulePath}`)
          }
          seenSlugs.set(slugKey, modulePath)

          imports.push(`import ${contentIdentifier}, { meta as ${metaIdentifier} } from "${relativeImportPath}"`)
          records.push({
            locale,
            section,
            contentIdentifier,
            metaIdentifier,
            meta,
            body: extractContentBody(source, modulePath),
          })
        } catch (error) {
          invalidEntries.push(formatContentError(modulePath, error))
        }
      }
    }
  }

  const noteRelations = createNoteRelations(records)
  const referenceMap = createReferenceMap(records)

  const fileContent = `/* eslint-disable @typescript-eslint/no-unused-vars */
import type { BlogMeta, ContentModule, Locale, NoteMeta, NoteRelationMap, ProjectMeta } from "@/lib/content/mdx-content"
import type { ComponentType } from "react"

${imports.join("\n")}

const asBlogModule = (meta: BlogMeta, content: ComponentType): ContentModule<BlogMeta> => ({ meta, content })
const asNoteModule = (meta: NoteMeta, content: ComponentType): ContentModule<NoteMeta> => ({ meta, content })
const asProjectModule = (meta: ProjectMeta, content: ComponentType): ContentModule<ProjectMeta> => ({ meta, content })

export const generatedBlogModules: Record<Locale, ContentModule<BlogMeta>[]> = {
${locales
  .map((locale) => {
    const items = records
      .filter((record) => record.locale === locale && record.section === "blog")
      .map((record) => `    asBlogModule(${record.metaIdentifier} as BlogMeta, ${record.contentIdentifier}),`)
      .join("\n")

    return `  ${locale}: [\n${items}\n  ],`
  })
  .join("\n")}
}

export const generatedNoteModules: Record<Locale, ContentModule<NoteMeta>[]> = {
${locales
  .map((locale) => {
    const items = records
      .filter((record) => record.locale === locale && record.section === "notes")
      .map((record) => `    asNoteModule(${record.metaIdentifier} as NoteMeta, ${record.contentIdentifier}),`)
      .join("\n")

    return `  ${locale}: [\n${items}\n  ],`
  })
  .join("\n")}
}

export const generatedProjectModules: Record<Locale, ContentModule<ProjectMeta>[]> = {
${locales
  .map((locale) => {
    const items = records
      .filter((record) => record.locale === locale && record.section === "projects")
      .map((record) => `    asProjectModule(${record.metaIdentifier} as ProjectMeta, ${record.contentIdentifier}),`)
      .join("\n")

    return `  ${locale}: [\n${items}\n  ],`
  })
  .join("\n")}
}

export const generatedNoteRelations: Record<Locale, NoteRelationMap> = ${JSON.stringify(noteRelations, null, 2)}
`

  const studioFileContent = `export type GeneratedStudioContentRecord = {
  locale: "en" | "zh"
  section: "blog" | "notes" | "projects"
  slug: string
  title: string
  draft: boolean
  meta: Record<string, unknown>
  body: string
  source: string
}

export const generatedStudioContentRecords: GeneratedStudioContentRecord[] = ${JSON.stringify(
    records.map((record) => ({
      locale: record.locale,
      section: record.section,
      slug: record.meta.slug,
      title: typeof record.meta.title === "string" && record.meta.title.trim() ? record.meta.title : record.meta.slug,
      draft: Boolean(record.meta.draft),
      meta: record.meta,
      body: record.body,
      source: createStudioSourceLiteral(record.meta, record.body),
    })),
    null,
    2,
  )}
`

  await ensureDirectory(path.dirname(outputFile))
  await fs.writeFile(outputFile, fileContent, "utf8")
  await fs.writeFile(studioOutputFile, studioFileContent, "utf8")
  await fs.writeFile(referenceMapFile, `${JSON.stringify(referenceMap, null, 2)}\n`, "utf8")

  if (invalidEntries.length > 0) {
    console.warn("Skipped invalid content files while generating the content index:")
    for (const entry of invalidEntries) {
      console.warn(`- ${entry}`)
    }
  }
}

function createStudioSourceLiteral(meta, body) {
  const trimmedBody = typeof body === "string" ? body.trimEnd() : ""
  return `export const meta = ${JSON.stringify(meta, null, 2)}\n\n${trimmedBody ? `${trimmedBody}\n` : ""}`
}

main().catch((error) => {
  console.error("Failed to generate content index.")
  console.error(error)
  process.exitCode = 1
})
