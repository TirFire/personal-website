import { readFileSync } from "node:fs"
import path from "node:path"

let cachedReferenceMap = null

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

function referenceCandidates(value) {
  const normalized = normalizeReference(value).replace(/\\/g, "/")
  const basename = normalized.split("/").filter(Boolean).at(-1) ?? normalized

  return [normalized, basename, slugifyReference(normalized), slugifyReference(basename)].filter(Boolean)
}

function getReferenceMap() {
  if (cachedReferenceMap) return cachedReferenceMap

  try {
    cachedReferenceMap = JSON.parse(readFileSync(path.join(process.cwd(), "lib", "content", "generated-reference-map.json"), "utf8"))
  } catch {
    cachedReferenceMap = {}
  }

  return cachedReferenceMap
}

function getLocaleFromFile(file) {
  const filePath = String(file?.path ?? "").replace(/\\/g, "/")
  const match = filePath.match(/\/content\/(en|zh)\//)
  return match?.[1] ?? "zh"
}

function resolveWikiLink(locale, target) {
  const map = getReferenceMap()
  const localeMap = map[locale] ?? map.zh ?? {}

  for (const candidate of referenceCandidates(target)) {
    const href = localeMap[candidate]
    if (href) return href
  }

  return `/learning/${slugifyReference(target)}`
}

function splitWikiText(value, locale) {
  const nodes = []
  const pattern = /(?<!!)\[\[([^[\]]+?)\]\]/g
  let cursor = 0
  let match = pattern.exec(value)

  while (match) {
    if (match.index > cursor) {
      nodes.push({ type: "text", value: value.slice(cursor, match.index) })
    }

    const [rawTarget, ...aliasParts] = String(match[1]).split("|")
    const target = rawTarget.split("#")[0]?.trim()
    const label = aliasParts.join("|").trim() || rawTarget.trim()

    if (target) {
      nodes.push({
        type: "link",
        url: resolveWikiLink(locale, target),
        title: null,
        children: [{ type: "text", value: label }],
      })
    } else {
      nodes.push({ type: "text", value: match[0] })
    }

    cursor = match.index + match[0].length
    match = pattern.exec(value)
  }

  if (cursor < value.length) {
    nodes.push({ type: "text", value: value.slice(cursor) })
  }

  return nodes
}

function transformNode(node, locale, parentType = "") {
  if (!node || typeof node !== "object") return

  if (["link", "linkReference", "definition", "code", "inlineCode"].includes(parentType)) {
    return
  }

  if (!Array.isArray(node.children)) {
    return
  }

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]

    if (child?.type === "text" && typeof child.value === "string" && child.value.includes("[[")) {
      const replacement = splitWikiText(child.value, locale)
      node.children.splice(index, 1, ...replacement)
      index += replacement.length - 1
      continue
    }

    transformNode(child, locale, child?.type)
  }
}

export default function remarkWikiLinks() {
  return (tree, file) => {
    transformNode(tree, getLocaleFromFile(file))
  }
}
