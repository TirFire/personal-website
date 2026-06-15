export type StudioLocale = "en" | "zh"
export type StudioSection = "blog" | "notes" | "projects"
export type StudioMeta = Record<string, unknown>
export type ImportedStudioAsset = {
  name: string
  url: string
}
export type ImportedStudioReference = {
  locale: StudioLocale
  section: StudioSection
  slug: string
  title: string
}

type ImportedStudioContent = {
  meta: StudioMeta
  body: string
}

const codeFencePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/
const inlineCodePattern = /(`[^`\n]+`)/

function sanitizeReference(value: string) {
  return value.trim().replace(/^<|>$/g, "")
}

function normalizeReferenceKey(value: string) {
  const sanitized = sanitizeReference(value).replace(/\\/g, "/")

  try {
    return decodeURIComponent(sanitized).toLowerCase()
  } catch {
    return sanitized.toLowerCase()
  }
}

function getReferenceBasename(value: string) {
  const normalized = normalizeReferenceKey(value)
  const segments = normalized.split("/")
  return segments.at(-1) ?? normalized
}

function deriveImageAlt(value: string) {
  return getReferenceBasename(value)
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
}

function wrapMarkdownUrl(value: string) {
  return /\s/.test(value) ? `<${value}>` : value
}

function splitOutsideCode(source: string, pattern: RegExp, transform: (segment: string) => string) {
  return source
    .split(pattern)
    .map((segment, index) => (index % 2 === 1 ? segment : transform(segment)))
    .join("")
}

function resolveImportedAssetUrl(reference: string, assets: ImportedStudioAsset[]) {
  const normalizedReference = normalizeReferenceKey(reference)
  const basename = getReferenceBasename(reference)

  for (const asset of assets) {
    const normalizedName = normalizeReferenceKey(asset.name)
    if (normalizedReference === normalizedName || basename === normalizedName || basename === getReferenceBasename(asset.name)) {
      return asset.url
    }
  }

  return null
}

function replaceMarkdownHighlights(source: string) {
  return source
    .split(inlineCodePattern)
    .map((segment, index) => (index % 2 === 1 ? segment : segment.replace(/==([^=\n][^=\n]*?)==/g, "<mark>$1</mark>")))
    .join("")
}

function slugifyWikiLinkTarget(value: string) {
  return value
    .trim()
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5/]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getPublicPathForSection(section: StudioSection, slug: string) {
  if (section === "blog") return `/blog/${slug}`
  if (section === "notes") return `/learning/${slug}`
  return `/projects/${slug}`
}

function normalizeWikiLinkCandidates(value: string) {
  const trimmed = value.trim().replace(/\.[^.]+$/, "")
  const normalized = normalizeReferenceKey(trimmed)
  const basename = getReferenceBasename(trimmed).replace(/\.[^.]+$/, "")
  const slug = slugifyWikiLinkTarget(trimmed)
  const basenameSlug = slugifyWikiLinkTarget(basename)
  const pathParts = normalized.split("/").filter(Boolean)
  const maybeSection = pathParts[0]

  return {
    normalized,
    basename,
    slug,
    basenameSlug,
    explicitSection:
      maybeSection === "blog" || maybeSection === "notes" || maybeSection === "projects"
        ? (maybeSection as StudioSection)
        : undefined,
  }
}

function resolveWikiLinkReference(
  rawTarget: string,
  references: ImportedStudioReference[],
  preferredLocale?: StudioLocale,
) {
  const candidates = normalizeWikiLinkCandidates(rawTarget)

  const scored = references
    .map((reference) => {
      const titleSlug = slugifyWikiLinkTarget(reference.title)
      const directMatch =
        candidates.slug === reference.slug ||
        candidates.basenameSlug === reference.slug ||
        candidates.slug === titleSlug ||
        candidates.basenameSlug === titleSlug ||
        candidates.normalized === normalizeReferenceKey(reference.slug) ||
        candidates.basename === reference.title.trim()

      if (!directMatch) {
        return null
      }

      let score = 0

      if (candidates.slug === reference.slug) score += 5
      if (candidates.basenameSlug === reference.slug) score += 4
      if (candidates.slug === titleSlug) score += 4
      if (candidates.basenameSlug === titleSlug) score += 3
      if (candidates.normalized === normalizeReferenceKey(reference.slug)) score += 2
      if (candidates.basename === reference.title.trim()) score += 1
      if (preferredLocale && reference.locale === preferredLocale) score += 3
      if (candidates.explicitSection && reference.section === candidates.explicitSection) score += 3

      return {
        reference,
        score,
      }
    })
    .filter((item): item is { reference: ImportedStudioReference; score: number } => item !== null)
    .sort((left, right) => right.score - left.score || left.reference.title.localeCompare(right.reference.title))

  return scored[0]?.reference
}

function replaceObsidianWikiLinks(source: string, references: ImportedStudioReference[], preferredLocale?: StudioLocale) {
  return source
    .split(inlineCodePattern)
    .map((segment, index) => {
      if (index % 2 === 1) {
        return segment
      }

      return segment.replace(/(?<!!)\[\[([^[\]]+?)\]\]/g, (_match, rawValue) => {
        const [rawTarget, ...rest] = String(rawValue).split("|")
        const target = rawTarget.trim()
        const alias = rest.join("|").trim()
        const label = alias || target
        const resolvedReference = resolveWikiLinkReference(target, references, preferredLocale)

        if (!resolvedReference) {
          return label
        }

        return `[${label}](${getPublicPathForSection(resolvedReference.section, resolvedReference.slug)})`
      })
    })
    .join("")
}

function normalizeObsidianCallouts(source: string) {
  return source.replace(/^>\s*\[!([A-Za-z0-9_-]+)\]([+-])?\s*(.*)$/gm, (_match, type, foldMarker = "", title = "") => {
    const normalizedTitle = String(title).trim()
    const foldSuffix = foldMarker ? ` ${foldMarker}` : ""
    return `> [!${type}]${foldSuffix} ${normalizedTitle}`.trimEnd()
  })
}

function replaceObsidianImageEmbeds(source: string, assets: ImportedStudioAsset[]) {
  return source.replace(/!\[\[([^[\]]+?)\]\]/g, (_match, rawValue) => {
    const [rawReference, ...rest] = String(rawValue).split("|")
    const reference = rawReference.trim()
    const alias = rest.join("|").trim()
    const resolvedUrl = resolveImportedAssetUrl(reference, assets) ?? sanitizeReference(reference)
    const alt = alias && !/^\d+(?:x\d+)?$/.test(alias) ? alias : deriveImageAlt(reference)

    return `![${alt}](${wrapMarkdownUrl(resolvedUrl)})`
  })
}

function replaceMarkdownImagePaths(source: string, assets: ImportedStudioAsset[]) {
  return source.replace(/!\[([^\]]*)\]\(([^)\n]+)\)/g, (match, rawAlt, rawTarget) => {
    const target = sanitizeReference(String(rawTarget))
    if (/^(?:https?:\/\/|data:|\/)/i.test(target)) {
      return match
    }

    const resolvedUrl = resolveImportedAssetUrl(target, assets)
    if (!resolvedUrl) {
      return match
    }

    return `![${String(rawAlt)}](${wrapMarkdownUrl(resolvedUrl)})`
  })
}

function serializeKey(key: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
}

export function serializeStudioValue(value: unknown, indentLevel = 0): string {
  const pad = "  ".repeat(indentLevel)
  const nextPad = "  ".repeat(indentLevel + 1)

  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value === null) return "null"

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"

    return `[\n${value.map((item) => `${nextPad}${serializeStudioValue(item, indentLevel + 1)}`).join(",\n")}\n${pad}]`
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value)
    if (entries.length === 0) return "{}"

    return `{\n${entries
      .map(([key, itemValue]) => `${nextPad}${serializeKey(key)}: ${serializeStudioValue(itemValue, indentLevel + 1)}`)
      .join(",\n")}\n${pad}}`
  }

  return JSON.stringify(value)
}

export function extractMetaLiteral(source: string) {
  const marker = "export const meta ="
  const markerIndex = source.indexOf(marker)

  if (markerIndex === -1) {
    throw new Error("Could not find `export const meta =` in this file.")
  }

  const objectStart = source.indexOf("{", markerIndex)
  if (objectStart === -1) {
    throw new Error("Could not find the start of the meta object.")
  }

  let depth = 0
  let inString = false
  let stringQuote = ""
  let escaped = false

  for (let index = objectStart; index < source.length; index += 1) {
    const character = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (character === "\\") {
        escaped = true
        continue
      }

      if (character === stringQuote) {
        inString = false
        stringQuote = ""
      }

      continue
    }

    if (character === "\"" || character === "'" || character === "`") {
      inString = true
      stringQuote = character
      continue
    }

    if (character === "{") {
      depth += 1
      continue
    }

    if (character === "}") {
      depth -= 1
      if (depth === 0) {
        return {
          literal: source.slice(objectStart, index + 1),
          endIndex: index + 1,
        }
      }
    }
  }

  throw new Error("Could not find the end of the meta object.")
}

export function parseStudioSource(source: string) {
  const { literal, endIndex } = extractMetaLiteral(source)
  const meta = Function(`"use strict"; return (${literal});`)() as StudioMeta
  const body = source.slice(endIndex).replace(/^\s+/, "")

  return { meta, body }
}

function parseScalarValue(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ""
  if (trimmed === "true") return true
  if (trimmed === "false") return false

  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    try {
      return JSON.parse(trimmed.replace(/'/g, "\""))
    } catch {
      return trimmed
    }
  }

  return trimmed
}

function parseFrontmatter(source: string): ImportedStudioContent | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null

  const [, rawFrontmatter, body] = match
  const meta: StudioMeta = {}
  const lines = rawFrontmatter.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) continue

    const pairMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!pairMatch) continue

    const [, rawKey, rawValue] = pairMatch
    const key = rawKey.trim()
    const value = rawValue.trim()

    if (!value) {
      const items: string[] = []
      let nextIndex = index + 1

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex]
        const itemMatch = nextLine.match(/^\s*-\s+(.*)$/)
        if (!itemMatch) break

        items.push(itemMatch[1].trim())
        nextIndex += 1
      }

      meta[key] = items
      index = nextIndex - 1
      continue
    }

    meta[key] = parseScalarValue(value)
  }

  return {
    meta,
    body: body.replace(/^\s+/, ""),
  }
}

function slugifyFileStem(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function parseImportedStudioContent(source: string) {
  const trimmed = source.trimStart()

  if (trimmed.startsWith("export const meta =")) {
    return parseStudioSource(trimmed)
  }

  return parseFrontmatter(trimmed) ?? { meta: {}, body: source }
}

export function normalizeImportedStudioBody(
  source: string,
  assets: ImportedStudioAsset[] = [],
  references: ImportedStudioReference[] = [],
  preferredLocale?: StudioLocale,
) {
  return splitOutsideCode(source, codeFencePattern, (segment) => {
    const withEmbeds = replaceObsidianImageEmbeds(segment, assets)
    const withMarkdownImages = replaceMarkdownImagePaths(withEmbeds, assets)
    const withWikiLinks = replaceObsidianWikiLinks(withMarkdownImages, references, preferredLocale)
    const withCallouts = normalizeObsidianCallouts(withWikiLinks)
    return replaceMarkdownHighlights(withCallouts)
  })
}

export function deriveSlugFromFileName(fileName: string) {
  return slugifyFileStem(fileName)
}

export function createStudioSource(meta: StudioMeta, body: string) {
  const normalizedBody = body.trimEnd()
  return `export const meta = ${serializeStudioValue(meta)}\n\n${normalizedBody ? `${normalizedBody}\n` : ""}`
}

export function createDefaultStudioMeta(section: StudioSection, locale: StudioLocale, slug: string): StudioMeta {
  if (section === "blog") {
    return {
      title: locale === "zh" ? "新博客文章" : "New blog post",
      slug,
      category: "Research essay",
      date: "2026-06-13",
      readingTime: "5 min read",
      excerpt: locale === "zh" ? "简短摘要。" : "Short summary.",
      tags: ["Tag A"],
      draft: true,
      locale,
    }
  }

  if (section === "notes") {
    return {
      title: locale === "zh" ? "新笔记" : "New note",
      slug,
      series: "Research Notes",
      date: "2026-06-13",
      summary: locale === "zh" ? "简短摘要。" : "Short summary.",
      tags: ["Tag A"],
      draft: true,
      locale,
    }
  }

  return {
    title: locale === "zh" ? "新项目" : "New project",
    slug,
    period: "2026",
    category: "Research project",
    status: locale === "zh" ? "进行中" : "In progress",
    role: locale === "zh" ? "你的角色" : "Your role",
    summary: locale === "zh" ? "简短摘要。" : "Short summary.",
    outcome: locale === "zh" ? "当前阶段性结果。" : "Current milestone.",
    tags: ["LLM"],
    links: [{ href: "#", label: "Code" }],
    conclusion: locale === "zh" ? "一句话结论。" : "One-line conclusion.",
    background: ["..."],
    goal: ["..."],
    methods: ["..."],
    challenges: ["..."],
    results: ["..."],
    contributions: ["..."],
    nextSteps: ["..."],
    relatedSlugs: [],
    draft: true,
    locale,
  }
}
