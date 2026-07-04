"use client"

import type { ChangeEvent, ClipboardEvent, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import { PageIntro } from "@/components/site/page-intro"
import { useLocale } from "@/components/providers/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getStudioCopy } from "@/lib/content/data"
import { estimateReadingTimeText } from "@/lib/content/reading-time"
import {
  createStudioSource,
  deriveSlugFromFileName,
  normalizeImportedStudioBody,
  parseImportedStudioContent,
  type ImportedStudioAsset,
  type ImportedStudioReference,
} from "@/lib/content/studio-source"

type StudioLocale = "en" | "zh"
type StudioSection = "blog" | "notes" | "projects"
type StudioMode = "content" | "data"
type StudioContentStatusFilter = "all" | "published" | "draft"
type StudioLocaleFilter = "all" | "current" | StudioLocale
type StudioDataKey =
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

type StudioMeta = Record<string, unknown>
type StudioDataPrimitive = string | number | boolean | null
type StudioDataNode = StudioDataPrimitive | StudioDataNode[] | { [key: string]: StudioDataNode }
type StudioDataValue = Record<string, StudioDataNode> | Array<Record<string, StudioDataNode>>
type StudioUpdateBlock =
  | {
      type: "paragraph"
      text: string
    }
  | {
      type: "imageGrid"
      columns?: 2 | 3
      images: Array<{
        src: string
        alt: string
      }>
    }
type StudioGalleryPhoto = {
  src: string
  alt: string
  caption?: string
  videoSrc?: string
}
type StudioGalleryGroup = {
  slug: string
  title: string
  description: string
  caption: string
  cover?: string
  photos?: StudioGalleryPhoto[]
}
type StudioLocalPreview = {
  src: string
  label: string
  kind?: "image" | "video"
}
type StudioAssetSection = StudioSection | "gallery" | "updates"

type StudioItem = {
  locale: StudioLocale
  section: StudioSection
  slug: string
  title: string
  draft: boolean
}

type StudioDataItem = {
  key: StudioDataKey
  locale: StudioLocale
  title: string
  summary: string
}

type StudioRuntimeInfo = {
  backend: "filesystem" | "github" | "readonly-bundled"
  readSource: "filesystem" | "github" | "bundle"
  writeEnabled: boolean
  repo?: string
  branch?: string
}

type StudioCopy = Record<string, unknown> & {
  sectionLabels: Record<StudioSection, string>
  sectionDescriptions: Record<StudioSection, string>
}

const studioRecentContentStorageKey = "studio.recent-content"
const studioRecentDataStorageKey = "studio.recent-data"
const studioResumeContentStorageKey = "studio.resume-content"

const dataKeyOrder: StudioDataKey[] = [
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
const contentSectionOrder: StudioSection[] = ["blog", "notes", "projects"]

const dataKeyLabels: Record<StudioLocale, Record<StudioDataKey, string>> = {
  zh: {
    profile: "个人资料",
    social: "社交与联系",
    "research-areas": "研究方向",
    now: "Now 页面",
    updates: "动态流",
    output: "成果页",
    cv: "CV",
    gallery: "相册",
    friends: "友链",
    contact: "联系页",
    "site-config": "站点配置",
  },
  en: {
    profile: "Profile",
    social: "Social",
    "research-areas": "Research areas",
    now: "Now",
    updates: "Updates",
    output: "Output",
    cv: "CV",
    gallery: "Gallery",
    friends: "Friends",
    contact: "Contact",
    "site-config": "Site config",
  },
}

const commonMetaLabelKeys: Partial<Record<string, string>> = {
  category: "category",
  series: "series",
  date: "date",
  readingTime: "readingTime",
  excerpt: "excerpt",
  summary: "summary",
  tags: "tags",
  period: "period",
  status: "statusLabel",
  role: "role",
  outcome: "outcome",
}

const dataFieldLabelKeys: Partial<Record<string, string>> = {
  title: "titleField",
  description: "descriptionField",
  intro: "introNote",
  items: "friendsItems",
  name: "displayName",
  href: "linkHref",
  avatar: "avatar",
  applicationTitle: "applicationTitle",
  applicationNote: "applicationNote",
  applicationHref: "applicationHref",
  applicationLabel: "applicationLabel",
  applicationFormatLabel: "applicationFormatLabel",
  applicationFormat: "applicationFormat",
  copyLabel: "copyLabel",
  copiedLabel: "copiedLabel",
  guestbookTitle: "guestbookTitle",
  guestbookHint: "guestbookHint",
  featuredLabel: "featuredLabel",
  requestChecklist: "requestChecklist",
}

function parseCommaSeparatedList(value: string) {
  return value
    .split(/[,，、;；\r\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatCommaSeparatedList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : ""
}

function formatLineSeparatedList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).join("\n") : ""
}

function parseLineSeparatedList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function stringifyValue(value: unknown) {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return JSON.stringify(value, null, 2)
  }

  return typeof value === "undefined" ? "" : String(value)
}

function parseLooseValue(rawValue: string) {
  const value = rawValue.trim()
  if (!value) return ""
  if (value === "true") return true
  if (value === "false") return false

  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
    return JSON.parse(value)
  }

  return rawValue
}

function isRecommendedSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

function getPublicPath(section: StudioSection | undefined, slug: string) {
  if (!section || !slug) return ""
  if (section === "blog") return `/blog/${slug}`
  if (section === "notes") return `/learning/${slug}`
  return `/projects/${slug}`
}

function getStudioFilePath(locale: StudioLocale, section: StudioSection, slug: string) {
  return `content/${locale}/${section}/${slug}.mdx`
}

function getDataLabel(key: StudioDataKey, locale: StudioLocale) {
  return dataKeyLabels[locale][key]
}

function resolveCopyMessage(message: unknown, value: string) {
  if (typeof message === "function") {
    return String(message(value))
  }

  if (typeof message === "string") {
    return message.replace("{value}", value)
  }

  return value
}

function buildStudioItemKey(locale: StudioLocale, section: StudioSection, slug: string) {
  return `${locale}/${section}/${slug}`
}

function buildStudioDataItemKey(key: StudioDataKey, locale: StudioLocale) {
  return `${key}/${locale}`
}

function pushRecentStudioKey(keys: string[], nextKey: string, limit = 8) {
  return [nextKey, ...keys.filter((key) => key !== nextKey)].slice(0, limit)
}

function normalizeSnapshotValue(value: string) {
  return value.replace(/\r\n/g, "\n").trim()
}

function serializeStudioItemState(meta: StudioMeta, body: string) {
  return JSON.stringify({ meta, body })
}

function formatStudioTime(locale: StudioLocale, date: Date) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

function readStoredStringArray(key: string) {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []
  } catch {
    return []
  }
}

function readStoredResumeKey() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(studioResumeContentStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { key?: unknown }
    return typeof parsed.key === "string" ? parsed.key : null
  } catch {
    return null
  }
}

function getMetaFieldLabel(copy: StudioCopy, fieldKey: string) {
  if (fieldKey === "title") return String(copy.titleField)
  if (fieldKey === "slug") return String(copy.slug)
  if (fieldKey === "locale") return String(copy.locale)
  if (fieldKey === "draft") return String(copy.draftField)

  const labelKey = commonMetaLabelKeys[fieldKey]
  if (labelKey && typeof copy[labelKey] !== "undefined") {
    return String(copy[labelKey])
  }

  return fieldKey
}

function getDataFieldLabel(copy: StudioCopy, fieldKey: string) {
  const labelKey = dataFieldLabelKeys[fieldKey]
  if (labelKey && typeof copy[labelKey] !== "undefined") {
    return String(copy[labelKey])
  }

  return fieldKey
}

function isPlainObject(value: unknown): value is Record<string, StudioDataNode> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isArrayOfStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isArrayOfObjects(value: unknown): value is Array<Record<string, StudioDataNode>> {
  return Array.isArray(value) && value.every((item) => isPlainObject(item))
}

function isStudioLocale(value: unknown): value is StudioLocale {
  return value === "zh" || value === "en"
}

function isStudioDataKey(value: string): value is StudioDataKey {
  return [
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
  ].includes(value)
}

function isParagraphBlock(value: unknown): value is Extract<StudioUpdateBlock, { type: "paragraph" }> {
  return isPlainObject(value) && value.type === "paragraph" && typeof value.text === "string"
}

function isImageGridBlock(value: unknown): value is Extract<StudioUpdateBlock, { type: "imageGrid" }> {
  return (
    isPlainObject(value) &&
    value.type === "imageGrid" &&
    Array.isArray(value.images) &&
    value.images.every((item) => isPlainObject(item) && typeof item.src === "string" && typeof item.alt === "string")
  )
}

function isStudioGalleryPhoto(value: unknown): value is StudioGalleryPhoto {
  return (
    isPlainObject(value) &&
    typeof value.src === "string" &&
    typeof value.alt === "string" &&
    (typeof value.caption === "undefined" || typeof value.caption === "string") &&
    (typeof value.videoSrc === "undefined" || typeof value.videoSrc === "string")
  )
}

function isStudioGalleryGroup(value: unknown): value is StudioGalleryGroup {
  return (
    isPlainObject(value) &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.caption === "string" &&
    (typeof value.cover === "undefined" || typeof value.cover === "string") &&
    (typeof value.photos === "undefined" || (Array.isArray(value.photos) && value.photos.every((item) => isStudioGalleryPhoto(item))))
  )
}

function hasGalleryPhotoSrc(photo: StudioGalleryPhoto): boolean {
  return photo.src.trim().length > 0
}

function deriveAssetLabel(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
}

function slugifyUploadTarget(value: string, fallback: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback
}

function createLocalPreviews(files: File[]) {
  return files.map((file) => ({
    src: URL.createObjectURL(file),
    label: deriveAssetLabel(file.name || "pasted-image"),
    kind: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
  }))
}

function revokeLocalPreviews(previews?: StudioLocalPreview[]) {
  for (const preview of previews ?? []) {
    URL.revokeObjectURL(preview.src)
  }
}

function normalizeImageFiles(files: File[], prefix: string) {
  const timestamp = Date.now()

  return files.map((file, index) => {
    if (file.name && file.name.trim()) {
      return file
    }

    const extension = file.type.replace("image/", "") || "png"
    return new File([file], `${prefix}-${timestamp}-${index + 1}.${extension}`, { type: file.type || "image/png" })
  })
}

function getPastedImageFiles(event: ClipboardEvent<HTMLElement>, prefix: string) {
  const items = Array.from(event.clipboardData?.items ?? [])
  const files = items
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file))

  return normalizeImageFiles(files, prefix)
}

function getGalleryPreviewPhotos(group: StudioGalleryGroup) {
  const photos = (group.photos ?? []).filter(hasGalleryPhotoSrc)
  const coverPhoto = group.cover ? photos.find((photo) => photo.src === group.cover) : undefined
  const remainingPhotos = photos.filter((photo) => photo.src !== coverPhoto?.src)

  if (coverPhoto) {
    return [remainingPhotos[0], coverPhoto, remainingPhotos[1]].filter(Boolean) as StudioGalleryPhoto[]
  }

  return photos.slice(0, 3)
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createEmptyLike(value: StudioDataNode): StudioDataNode {
  if (Array.isArray(value)) {
    return value.length > 0 ? [createEmptyLike(value[0])] : []
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, createEmptyLike(item)]))
  }

  if (typeof value === "boolean") return false
  if (typeof value === "number") return 0
  return ""
}

function pathToSegments(path: string) {
  return path ? path.split(".") : []
}

function getValueAtPath(root: StudioDataNode | StudioDataValue, path: string) {
  return pathToSegments(path).reduce<unknown>((current, segment) => {
    if (Array.isArray(current)) {
      return current[Number(segment)]
    }

    if (isPlainObject(current)) {
      return current[segment]
    }

    return undefined
  }, root)
}

function setValueAtPath(root: StudioDataValue, path: string, value: StudioDataNode): StudioDataValue {
  const nextRoot = deepClone(root)
  const segments = pathToSegments(path)

  if (segments.length === 0) {
    return value as StudioDataValue
  }

  let cursor: unknown = nextRoot

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    cursor = Array.isArray(cursor) ? cursor[Number(segment)] : (cursor as Record<string, unknown>)[segment]
  }

  const finalSegment = segments.at(-1)
  if (!finalSegment) return nextRoot

  if (Array.isArray(cursor)) {
    cursor[Number(finalSegment)] = value
  } else if (isPlainObject(cursor)) {
    cursor[finalSegment] = value
  }

  return nextRoot
}

function mutateArrayAtPath(root: StudioDataValue, path: string, mutate: (items: StudioDataNode[]) => void): StudioDataValue {
  const current = getValueAtPath(root, path)
  if (!Array.isArray(current)) {
    return root
  }

  const nextItems = deepClone(current)
  mutate(nextItems)
  return setValueAtPath(root, path, nextItems)
}

function getObjectItemTitle(item: Record<string, StudioDataNode>, index: number) {
  const candidateKeys = ["title", "label", "name", "date", "period", "displayName"]

  for (const key of candidateKeys) {
    const value = item[key]
    if (typeof value === "string" && value.trim()) {
      return value
    }
  }

  return `Item ${index + 1}`
}

async function readFileText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."))
    reader.readAsText(file, "utf-8")
  })
}

function isMarkdownFile(file: File) {
  return /\.mdx?$/i.test(file.name) || file.type === "text/markdown" || file.type === "text/plain"
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg|avif|heic)$/i.test(file.name)
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(file.name)
}

function withAutomaticContentMeta(section: StudioSection, meta: StudioMeta, body: string): StudioMeta {
  const nextMeta = { ...meta }
  const metaLocale = nextMeta.locale === "en" || nextMeta.locale === "zh" ? nextMeta.locale : "zh"

  if (section === "blog") {
    nextMeta.readingTime = estimateReadingTimeText(body, metaLocale)
  }

  return nextMeta
}

export function StudioPageContent({
  authConfigured = false,
  runtimeInfo,
}: {
  authConfigured?: boolean
  runtimeInfo: StudioRuntimeInfo
}) {
  const { locale } = useLocale()
  const copy = useMemo(() => getStudioCopy(locale) as StudioCopy, [locale])

  const [mode, setMode] = useState<StudioMode>("content")

  const [items, setItems] = useState<StudioItem[]>([])
  const [references, setReferences] = useState<ImportedStudioReference[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [meta, setMeta] = useState<StudioMeta>({})
  const [body, setBody] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewError, setPreviewError] = useState("")
  const [status, setStatus] = useState("")
  const [contentQuery, setContentQuery] = useState("")
  const [contentStatusFilter, setContentStatusFilter] = useState<StudioContentStatusFilter>("all")
  const [contentLocaleFilter, setContentLocaleFilter] = useState<StudioLocaleFilter>("current")
  const [recentContentKeys, setRecentContentKeys] = useState<string[]>(() => readStoredStringArray(studioRecentContentStorageKey))
  const [savePending, setSavePending] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [previewPending, setPreviewPending] = useState(false)
  const [contentRegenerating, setContentRegenerating] = useState(false)
  const [lastContentSavedAt, setLastContentSavedAt] = useState("")
  const [signOutPending, setSignOutPending] = useState(false)

  const [newLocale, setNewLocale] = useState<StudioLocale>("zh")
  const [newSection, setNewSection] = useState<StudioSection>("blog")
  const [newSlug, setNewSlug] = useState("")

  const [dataItems, setDataItems] = useState<StudioDataItem[]>([])
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(null)
  const [dataValue, setDataValue] = useState<StudioDataValue>({})
  const [dataJson, setDataJson] = useState("")
  const [dataJsonDirty, setDataJsonDirty] = useState(false)
  const [dataStatus, setDataStatus] = useState("")
  const [dataQuery, setDataQuery] = useState("")
  const [dataLocaleFilter, setDataLocaleFilter] = useState<StudioLocaleFilter>("current")
  const [recentDataKeys, setRecentDataKeys] = useState<string[]>(() => readStoredStringArray(studioRecentDataStorageKey))
  const resumableContentKey = readStoredResumeKey()
  const [dataSavePending, setDataSavePending] = useState(false)
  const [dataCollapsed, setDataCollapsed] = useState(false)
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({})
  const [lastDataSavedAt, setLastDataSavedAt] = useState("")
  const [galleryUploadPending, setGalleryUploadPending] = useState(false)
  const [galleryVideoUploadPendingKey, setGalleryVideoUploadPendingKey] = useState<string | null>(null)
  const [updateUploadPendingKey, setUpdateUploadPendingKey] = useState<string | null>(null)
  const [galleryCaptionDrafts, setGalleryCaptionDrafts] = useState<Record<number, string>>({})
  const [updateCaptionDrafts, setUpdateCaptionDrafts] = useState<Record<string, string>>({})
  const [galleryUploadPreviewKey, setGalleryUploadPreviewKey] = useState<string | null>(null)
  const [galleryUploadPreviews, setGalleryUploadPreviews] = useState<Record<string, StudioLocalPreview[]>>({})
  const [updateUploadPreviews, setUpdateUploadPreviews] = useState<Record<string, StudioLocalPreview[]>>({})

  const importInputRef = useRef<HTMLInputElement | null>(null)
  const galleryUploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const galleryVideoUploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const updateUploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const studioFocusRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const didLoadRef = useRef(false)

  const selectedSection = selectedKey?.split("/")[1] as StudioSection | undefined
  const selectedSlug = typeof meta.slug === "string" ? meta.slug : ""
  const selectedLocale = meta.locale === "zh" || meta.locale === "en" ? meta.locale : "zh"
  const selectedDraft = Boolean(meta.draft)
  const publicPath = getPublicPath(selectedSection, selectedSlug)
  const createSlugLooksGood = !newSlug || isRecommendedSlug(newSlug)
  const slugLooksGood = !selectedSlug || isRecommendedSlug(selectedSlug)
  const hasSource = Object.keys(meta).length > 0 || body.trim().length > 0
  const generatedSource = useMemo(() => (hasSource ? createStudioSource(meta, body) : ""), [body, hasSource, meta])
  const serializedDataValue = useMemo(() => `${JSON.stringify(dataValue, null, 2)}\n`, [dataValue])
  const selectedDataEntry = useMemo(() => {
    if (!selectedDataKey) return null

    const [key, entryLocale] = selectedDataKey.split("/")
    if (!isStudioDataKey(key) || !isStudioLocale(entryLocale)) return null

    return { key, locale: entryLocale }
  }, [selectedDataKey])
  const selectedItemSnapshot = useMemo(() => serializeStudioItemState(meta, body), [body, meta])
  const [savedItemSnapshot, setSavedItemSnapshot] = useState(selectedItemSnapshot)
  const contentDirty = selectedKey ? normalizeSnapshotValue(selectedItemSnapshot) !== normalizeSnapshotValue(savedItemSnapshot) : false
  const normalizedDataJson = useMemo(
    () => normalizeSnapshotValue(dataJsonDirty ? dataJson : serializedDataValue),
    [dataJson, dataJsonDirty, serializedDataValue],
  )
  const [savedDataSnapshot, setSavedDataSnapshot] = useState(normalizedDataJson)
  const dataDirty = Boolean(selectedDataKey) && normalizedDataJson !== savedDataSnapshot
  const contentSummaryTone = contentDirty ? "border-amber-500/35 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"
  const dataSummaryTone = dataDirty ? "border-amber-500/35 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"
  const studioReadOnly = !runtimeInfo.writeEnabled
  const studioAccessModeLabel = authConfigured
    ? locale === "zh"
      ? "已启用访问保护"
      : "Protected mode enabled"
    : locale === "zh"
      ? "当前为本地开放模式"
      : "Local open mode"

  const studioBackendLabel =
    runtimeInfo.backend === "github"
      ? locale === "zh"
        ? "GitHub 云端编辑模式"
        : "GitHub cloud editing mode"
      : studioReadOnly
        ? locale === "zh"
          ? "线上只读模式"
          : "Deployed read-only mode"
        : locale === "zh"
          ? "本地文件编辑模式"
          : "Local file editing mode"

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/studio/items")
    const data = await response.json()

    if (!response.ok) {
      setStatus(data.error ?? String(copy.loadFailed))
      return
    }

    setItems(data.items ?? [])
  }, [copy.loadFailed])

  const loadReferences = useCallback(async () => {
    const response = await fetch("/api/studio/references")
    const data = await response.json()

    if (!response.ok) {
      return
    }

    setReferences(Array.isArray(data.references) ? (data.references as ImportedStudioReference[]) : [])
  }, [])

  const loadDataItems = useCallback(async () => {
    const response = await fetch("/api/studio/data")
    const data = await response.json()

    if (!response.ok) {
      setDataStatus(data.error ?? String(copy.dataLoadFailed))
      return
    }

    setDataItems(data.items ?? [])
  }, [copy.dataLoadFailed])

  const registerRecentContentKey = useCallback((key: string) => {
    setRecentContentKeys((current) => {
      const next = pushRecentStudioKey(current, key)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(studioRecentContentStorageKey, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const registerRecentDataKey = useCallback((key: string) => {
    setRecentDataKeys((current) => {
      const next = pushRecentStudioKey(current, key)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(studioRecentDataStorageKey, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const shouldContinueWithUnsavedContent = useCallback(() => {
    if (!contentDirty) return true

    const message =
      locale === "zh"
        ? "当前内容还有未保存修改，继续操作会丢失这些改动。确认继续吗？"
        : "You have unsaved content changes. Continue and discard them?"

    return window.confirm(message)
  }, [contentDirty, locale])

  const shouldContinueWithUnsavedData = useCallback(() => {
    if (!dataDirty) return true

    const message =
      locale === "zh"
        ? "当前结构化资料还有未保存修改，继续操作会丢失这些改动。确认继续吗？"
        : "You have unsaved structured data changes. Continue and discard them?"

    return window.confirm(message)
  }, [dataDirty, locale])

  const openItem = useCallback(
    async (item: StudioItem) => {
      if (!shouldContinueWithUnsavedContent()) return

      const response = await fetch(`/api/studio/item?locale=${item.locale}&section=${item.section}&slug=${item.slug}`)
      const data = await response.json()

      if (!response.ok) {
        setStatus(data.error ?? String(copy.loadFailed))
        return
      }

      setSelectedKey(`${item.locale}/${item.section}/${item.slug}`)
      setMeta(data.meta ?? {})
      setBody(data.body ?? "")
      setSavedItemSnapshot(serializeStudioItemState(data.meta ?? {}, data.body ?? ""))
      registerRecentContentKey(buildStudioItemKey(item.locale, item.section, item.slug))
      setStatus(resolveCopyMessage(copy.editing, item.slug))
      setPreviewError("")
    },
    [copy, registerRecentContentKey, shouldContinueWithUnsavedContent],
  )

  const openDataItem = useCallback(
    async (item: StudioDataItem) => {
      if (!shouldContinueWithUnsavedData()) return

      const response = await fetch(`/api/studio/data?key=${item.key}&locale=${item.locale}`)
      const data = await response.json()

      if (!response.ok) {
        setDataStatus(data.error ?? String(copy.dataLoadFailed))
        return
      }

      setSelectedDataKey(`${item.key}/${item.locale}`)
      setDataValue(data.value ?? {})
      setDataJson(`${JSON.stringify(data.value ?? {}, null, 2)}\n`)
      setDataJsonDirty(false)
      setSavedDataSnapshot(normalizeSnapshotValue(`${JSON.stringify(data.value ?? {}, null, 2)}\n`))
      setCollapsedCards({})
      registerRecentDataKey(buildStudioDataItemKey(item.key, item.locale))
      setDataStatus(resolveCopyMessage(copy.dataEditing, getDataLabel(item.key, locale)))
    },
    [copy, locale, registerRecentDataKey, shouldContinueWithUnsavedData],
  )

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true

    queueMicrotask(() => {
      void loadItems()
      void loadReferences()
      void loadDataItems()
    })
  }, [loadDataItems, loadItems, loadReferences])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!selectedKey) {
      window.localStorage.removeItem(studioResumeContentStorageKey)
      return
    }

    window.localStorage.setItem(
      studioResumeContentStorageKey,
      JSON.stringify({
        key: selectedKey,
        title: typeof meta.title === "string" ? meta.title : selectedSlug || selectedKey,
        updatedAt: Date.now(),
      }),
    )
  }, [meta.title, selectedKey, selectedSlug])

  useEffect(() => {
    if (!selectedKey) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setPreviewPending(true)

      try {
        const response = await fetch("/api/studio/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meta, body }),
        })
        const data = await response.json()

        if (cancelled) return

        if (!response.ok) {
          setPreviewHtml("")
          setPreviewError(data.error ?? String(copy.previewFailed))
          return
        }

        setPreviewHtml(data.html ?? "")
        setPreviewError("")
      } catch (error) {
        if (cancelled) return
        setPreviewHtml("")
        setPreviewError(error instanceof Error ? error.message : String(copy.previewFailed))
      } finally {
        if (!cancelled) {
          setPreviewPending(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [body, copy.previewFailed, meta, selectedKey])

  useEffect(() => {
    return () => {
      Object.values(galleryUploadPreviews).forEach((previews) => revokeLocalPreviews(previews))
      Object.values(updateUploadPreviews).forEach((previews) => revokeLocalPreviews(previews))
    }
  }, [galleryUploadPreviews, updateUploadPreviews])

  useEffect(() => {
    if (!selectedKey || !contentDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [contentDirty, selectedKey])

  useEffect(() => {
    if (!selectedDataKey || !dataDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [dataDirty, selectedDataKey])

  function focusStudioTarget(key: string) {
    window.requestAnimationFrame(() => {
      const element = studioFocusRefs.current[key]
      if (!element) return
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.focus({ preventScroll: true })
    })
  }

  function updateMetaField(key: string, value: unknown) {
    if (studioReadOnly) return
    setMeta((current) => ({ ...current, [key]: value }))
  }

  function updateDataValue(updater: (current: StudioDataValue) => StudioDataValue) {
    if (studioReadOnly) return
    setDataValue((current) => updater(current))
    setDataJsonDirty(false)
  }

  function updateDataField(path: string, value: StudioDataNode) {
    updateDataValue((current) => setValueAtPath(current, path, value))
  }

  function moveArrayItem(path: string, index: number, direction: -1 | 1) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, path, (items) => {
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= items.length) return
        const [item] = items.splice(index, 1)
        items.splice(targetIndex, 0, item)
      }),
    )
  }

  function duplicateArrayItem(path: string, index: number) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, path, (items) => {
        const item = items[index]
        if (typeof item === "undefined") return
        items.splice(index + 1, 0, deepClone(item))
      }),
    )
  }

  function removeArrayItem(path: string, index: number) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, path, (items) => {
        if (index < 0 || index >= items.length) return
        items.splice(index, 1)
      }),
    )
  }

  function addArrayItem(path: string) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, path, (items) => {
        const template = items[0]
        if (typeof template === "undefined") {
          items.push({})
          return
        }

        items.push(createEmptyLike(template))
      }),
    )
  }

  function getUpdateItems() {
    if (selectedDataEntry?.key !== "updates") return []

    const value = getValueAtPath(dataValue, "items")
    return isArrayOfObjects(value) ? value : []
  }

  function updateUpdateBlock(itemIndex: number, blockIndex: number, nextBlock: StudioUpdateBlock) {
    updateDataField(`items.${itemIndex}.blocks.${blockIndex}`, nextBlock as StudioDataNode)
  }

  function addUpdateBlock(itemIndex: number, type: StudioUpdateBlock["type"]) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, `items.${itemIndex}.blocks`, (items) => {
        if (type === "paragraph") {
          items.push({ type: "paragraph", text: "" })
          return
        }

        items.push({
          type: "imageGrid",
          columns: 3,
          images: [{ src: "", alt: "" }],
        })
      }),
    )
  }

  function duplicateUpdateBlock(itemIndex: number, blockIndex: number) {
    duplicateArrayItem(`items.${itemIndex}.blocks`, blockIndex)
  }

  function removeUpdateBlock(itemIndex: number, blockIndex: number) {
    removeArrayItem(`items.${itemIndex}.blocks`, blockIndex)
  }

  function moveUpdateBlock(itemIndex: number, blockIndex: number, direction: -1 | 1) {
    moveArrayItem(`items.${itemIndex}.blocks`, blockIndex, direction)
  }

  function addUpdateBlockImage(itemIndex: number, blockIndex: number) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, `items.${itemIndex}.blocks.${blockIndex}.images`, (items) => {
        items.push({ src: "", alt: "" })
      }),
    )
  }

  function updateUpdateBlockImage(itemIndex: number, blockIndex: number, imageIndex: number, field: "src" | "alt", nextValue: string) {
    updateDataField(`items.${itemIndex}.blocks.${blockIndex}.images.${imageIndex}.${field}`, nextValue)
  }

  function removeUpdateBlockImage(itemIndex: number, blockIndex: number, imageIndex: number) {
    removeArrayItem(`items.${itemIndex}.blocks.${blockIndex}.images`, imageIndex)
  }

  function moveUpdateBlockImage(itemIndex: number, blockIndex: number, imageIndex: number, direction: -1 | 1) {
    moveArrayItem(`items.${itemIndex}.blocks.${blockIndex}.images`, imageIndex, direction)
  }

  function replaceGalleryUploadPreview(key: string, previews: StudioLocalPreview[]) {
    setGalleryUploadPreviews((current) => {
      revokeLocalPreviews(current[key])
      return {
        ...current,
        [key]: previews,
      }
    })
  }

  function clearGalleryUploadPreview(key: string) {
    setGalleryUploadPreviews((current) => {
      if (!current[key]) return current

      revokeLocalPreviews(current[key])
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function replaceUpdateUploadPreview(key: string, previews: StudioLocalPreview[]) {
    setUpdateUploadPreviews((current) => {
      revokeLocalPreviews(current[key])
      return {
        ...current,
        [key]: previews,
      }
    })
  }

  function clearUpdateUploadPreview(key: string) {
    setUpdateUploadPreviews((current) => {
      if (!current[key]) return current

      revokeLocalPreviews(current[key])
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function applyUpdateBlockImageAltDrafts(itemIndex: number, blockIndex: number, rawValue: string) {
    const labels = rawValue
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)

    updateDataValue((current) => {
      const nextValue = deepClone(current)
      const imagesValue = getValueAtPath(nextValue, `items.${itemIndex}.blocks.${blockIndex}.images`)
      if (!Array.isArray(imagesValue)) return current

      imagesValue.forEach((image, imageIndex) => {
        if (!isPlainObject(image) || typeof image.src !== "string") return
        image.alt = labels[imageIndex] ?? (typeof image.alt === "string" ? image.alt : "")
      })

      return nextValue
    })

    setDataStatus(locale === "zh" ? "已批量更新图片说明。" : "Image captions updated in bulk.")
  }

  async function handleUpdateItemImageFiles(itemIndex: number, files: File[]) {
    if (files.length === 0 || selectedDataEntry?.key !== "updates") {
      return
    }

    const items = getUpdateItems()
    const item = items[itemIndex]
    if (!item || !selectedDataEntry.locale) {
      return
    }

    const uploadKey = `update-item-${itemIndex}`
    setUpdateUploadPendingKey(uploadKey)
    replaceUpdateUploadPreview(uploadKey, createLocalPreviews(files))

    try {
      const targetSlug = slugifyUploadTarget(typeof item.title === "string" ? item.title : "", `update-${itemIndex + 1}`)
      const assets = await uploadStudioAssets(files, selectedDataEntry.locale, "updates", targetSlug)
      const coverAsset = assets[0]

      if (coverAsset) {
        updateDataField(`items.${itemIndex}.image`, coverAsset.url)
      }

      setDataStatus(locale === "zh" ? "头图已上传并回填到这条说说。" : "Cover image uploaded and inserted into this update.")
      focusStudioTarget(`update-cover-preview-${itemIndex}`)
    } catch (error) {
      setDataStatus(error instanceof Error ? error.message : locale === "zh" ? "上传头图失败。" : "Failed to upload cover image.")
    } finally {
      clearUpdateUploadPreview(uploadKey)
      setUpdateUploadPendingKey((current) => (current === uploadKey ? null : current))
    }
  }

  async function handleUpdateBlockImageFiles(itemIndex: number, blockIndex: number, files: File[]) {
    if (files.length === 0 || selectedDataEntry?.key !== "updates") {
      return
    }

    const items = getUpdateItems()
    const item = items[itemIndex]
    if (!item || !selectedDataEntry.locale) {
      return
    }
    const blockValue = getValueAtPath(dataValue, `items.${itemIndex}.blocks.${blockIndex}.images`)
    const existingImageCount = Array.isArray(blockValue) ? blockValue.length : 0

    const uploadKey = `update-${itemIndex}-block-${blockIndex}`
    setUpdateUploadPendingKey(uploadKey)
    replaceUpdateUploadPreview(uploadKey, createLocalPreviews(files))

    try {
      const targetSlug = slugifyUploadTarget(typeof item.title === "string" ? item.title : "", `update-${itemIndex + 1}`)
      const assets = await uploadStudioAssets(files, selectedDataEntry.locale, "updates", targetSlug)

      updateDataValue((current) =>
        mutateArrayAtPath(current, `items.${itemIndex}.blocks.${blockIndex}.images`, (images) => {
          for (const asset of assets) {
            images.push({
              src: asset.url,
              alt: deriveAssetLabel(asset.name),
            })
          }
        }),
      )

      setDataStatus(locale === "zh" ? "图片已上传并插入到九宫格。" : "Images uploaded and inserted into the image grid.")
      focusStudioTarget(`update-image-${itemIndex}-${blockIndex}-${existingImageCount + assets.length - 1}`)
    } catch (error) {
      setDataStatus(error instanceof Error ? error.message : locale === "zh" ? "上传图片失败。" : "Failed to upload images.")
    } finally {
      clearUpdateUploadPreview(uploadKey)
      setUpdateUploadPendingKey((current) => (current === uploadKey ? null : current))
    }
  }

  async function handleUpdateItemImageUpload(itemIndex: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => isImageFile(file))
    event.target.value = ""
    await handleUpdateItemImageFiles(itemIndex, files)
  }

  async function handleUpdateBlockImageUpload(itemIndex: number, blockIndex: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => isImageFile(file))
    event.target.value = ""
    await handleUpdateBlockImageFiles(itemIndex, blockIndex, files)
  }

  function renderUpdateBlocksEditor() {
    const items = getUpdateItems()
    if (items.length === 0) return null

    return (
      <div className="mt-6 rounded-[1.6rem] border border-border/70 bg-card/45 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base text-foreground">{locale === "zh" ? "说说内容块" : "Update blocks"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "zh" ? "直接编辑段落和图片九宫格，不必再手改 JSON。" : "Edit paragraphs and image grids directly instead of hand-editing JSON."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {items.map((item, itemIndex) => {
            const title = typeof item.title === "string" && item.title.trim() ? item.title : `${locale === "zh" ? "动态" : "Update"} ${itemIndex + 1}`
            const blocksValue = getValueAtPath(dataValue, `items.${itemIndex}.blocks`)
            const blocks = Array.isArray(blocksValue) ? blocksValue : []
            const coverImage = typeof item.image === "string" ? item.image : ""
            const coverUploadKey = `update-item-${itemIndex}`
            const coverUploadPreviews = updateUploadPreviews[coverUploadKey] ?? []

            return (
              <div key={`update-blocks-${itemIndex}`} className="rounded-[1.4rem] border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {blocks.length} {locale === "zh" ? "个内容块" : "blocks"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => addUpdateBlock(itemIndex, "paragraph")}>
                      {locale === "zh" ? "新增段落" : "Add paragraph"}
                    </Button>
                    <Button variant="outline" onClick={() => addUpdateBlock(itemIndex, "imageGrid")}>
                      {locale === "zh" ? "新增图片组" : "Add image grid"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-card/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{locale === "zh" ? "动态封面图" : "Update cover image"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {locale === "zh" ? "这张图会用于说说列表卡片和详情页头图。" : "This image is used on the updates list card and detail presentation."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => updateUploadInputRefs.current[coverUploadKey]?.click()}
                        disabled={updateUploadPendingKey === coverUploadKey}
                      >
                        {updateUploadPendingKey === coverUploadKey
                          ? locale === "zh"
                            ? "上传中..."
                            : "Uploading..."
                          : locale === "zh"
                            ? "上传封面"
                            : "Upload cover"}
                      </Button>
                    </div>
                    <input
                      ref={(node) => {
                        updateUploadInputRefs.current[coverUploadKey] = node
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleUpdateItemImageUpload(itemIndex, event)}
                    />
                  </div>

                  <div
                    ref={(node) => {
                      studioFocusRefs.current[`update-cover-dropzone-${itemIndex}`] = node
                    }}
                    tabIndex={0}
                    className="mt-3 grid gap-3 rounded-[1rem] border border-dashed border-border/70 p-3 md:grid-cols-[minmax(0,1fr)_240px]"
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = "copy"
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) => isImageFile(file))
                      void handleUpdateItemImageFiles(itemIndex, files)
                    }}
                    onPaste={(event) => {
                      const files = getPastedImageFiles(event, `update-cover-${itemIndex + 1}`)
                      if (files.length === 0) return
                      event.preventDefault()
                      void handleUpdateItemImageFiles(itemIndex, files)
                    }}
                  >
                    <label className="text-sm text-muted-foreground">
                      {locale === "zh" ? "封面路径" : "Cover path"}
                      <Input
                        value={coverImage}
                        onChange={(event) => updateDataField(`items.${itemIndex}.image`, event.target.value)}
                        className="mt-2"
                      />
                      <span className="mt-2 block text-xs text-muted-foreground">
                        {locale === "zh" ? "可点击上传、拖入图片，或直接在这里粘贴截图。" : "Click upload, drag an image here, or paste a screenshot directly into this area."}
                      </span>
                    </label>
                    {coverUploadPreviews.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{locale === "zh" ? "本地预览" : "Local preview"}</p>
                        <div className="grid gap-2">
                          {coverUploadPreviews.map((preview) => (
                            <div key={`${coverUploadKey}-${preview.src}`} className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/70">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preview.src} alt={preview.label} className="aspect-[4/3] w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : coverImage ? (
                      <div
                        ref={(node) => {
                          studioFocusRefs.current[`update-cover-preview-${itemIndex}`] = node
                        }}
                        tabIndex={-1}
                        className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/70"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverImage} alt={title} className="aspect-[4/3] w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {blocks.map((block, blockIndex) => {
                    const blockKey = `update-${itemIndex}-block-${blockIndex}`

                    if (isParagraphBlock(block)) {
                      return (
                        <div key={blockKey} className="rounded-[1.2rem] border border-border/70 bg-card/55 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {locale === "zh" ? `段落 ${blockIndex + 1}` : `Paragraph ${blockIndex + 1}`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" onClick={() => moveUpdateBlock(itemIndex, blockIndex, -1)} disabled={blockIndex === 0}>
                                {String(copy.moveUp)}
                              </Button>
                              <Button variant="outline" onClick={() => moveUpdateBlock(itemIndex, blockIndex, 1)} disabled={blockIndex === blocks.length - 1}>
                                {String(copy.moveDown)}
                              </Button>
                              <Button variant="outline" onClick={() => duplicateUpdateBlock(itemIndex, blockIndex)}>
                                {String(copy.duplicate)}
                              </Button>
                              <Button variant="outline" onClick={() => removeUpdateBlock(itemIndex, blockIndex)}>
                                {String(copy.removeItem)}
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            value={block.text}
                            onChange={(event) =>
                              updateUpdateBlock(itemIndex, blockIndex, {
                                type: "paragraph",
                                text: event.target.value,
                              })
                            }
                            className="mt-3 min-h-28"
                          />
                        </div>
                      )
                    }

                    if (isImageGridBlock(block)) {
                      const columns = block.columns === 2 ? 2 : 3
                      const blockUploadKey = `update-${itemIndex}-block-${blockIndex}`
                      const blockUploadPreviews = updateUploadPreviews[blockUploadKey] ?? []

                      return (
                        <div key={blockKey} className="rounded-[1.2rem] border border-border/70 bg-card/55 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {locale === "zh" ? `图片组 ${blockIndex + 1}` : `Image grid ${blockIndex + 1}`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" onClick={() => moveUpdateBlock(itemIndex, blockIndex, -1)} disabled={blockIndex === 0}>
                                {String(copy.moveUp)}
                              </Button>
                              <Button variant="outline" onClick={() => moveUpdateBlock(itemIndex, blockIndex, 1)} disabled={blockIndex === blocks.length - 1}>
                                {String(copy.moveDown)}
                              </Button>
                              <Button variant="outline" onClick={() => duplicateUpdateBlock(itemIndex, blockIndex)}>
                                {String(copy.duplicate)}
                              </Button>
                              <Button variant="outline" onClick={() => removeUpdateBlock(itemIndex, blockIndex)}>
                                {String(copy.removeItem)}
                              </Button>
                            </div>
                          </div>

                          <label className="mt-3 block text-sm text-muted-foreground">
                            {locale === "zh" ? "列数" : "Columns"}
                            <select
                              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                              value={String(columns)}
                              onChange={(event) =>
                                updateUpdateBlock(itemIndex, blockIndex, {
                                  ...block,
                                  columns: Number(event.target.value) === 2 ? 2 : 3,
                                })
                              }
                            >
                              <option value="2">2</option>
                              <option value="3">3</option>
                            </select>
                          </label>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                            <div>
                              <p className="text-sm text-foreground">{locale === "zh" ? "上传到这个图片组" : "Upload into this grid"}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {locale === "zh" ? "上传后会自动追加到当前九宫格，并回填图片路径与 alt。" : "Uploaded images will be appended to this grid with path and alt filled in."}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => updateUploadInputRefs.current[blockUploadKey]?.click()}
                              disabled={updateUploadPendingKey === blockUploadKey}
                            >
                              {updateUploadPendingKey === blockUploadKey
                                ? locale === "zh"
                                  ? "上传中..."
                                  : "Uploading..."
                                : locale === "zh"
                                  ? "上传图片"
                                  : "Upload images"}
                            </Button>
                            <input
                              ref={(node) => {
                                updateUploadInputRefs.current[blockUploadKey] = node
                              }}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(event) => void handleUpdateBlockImageUpload(itemIndex, blockIndex, event)}
                            />
                          </div>

                          <div
                            ref={(node) => {
                              studioFocusRefs.current[`update-grid-dropzone-${itemIndex}-${blockIndex}`] = node
                            }}
                            tabIndex={0}
                            className="mt-3 rounded-2xl border border-dashed border-border/70 bg-card/35 p-3"
                            onDragOver={(event) => {
                              event.preventDefault()
                              event.dataTransfer.dropEffect = "copy"
                            }}
                            onDrop={(event) => {
                              event.preventDefault()
                              const files = Array.from(event.dataTransfer.files ?? []).filter((file) => isImageFile(file))
                              void handleUpdateBlockImageFiles(itemIndex, blockIndex, files)
                            }}
                            onPaste={(event) => {
                              const files = getPastedImageFiles(event, `update-grid-${itemIndex + 1}-${blockIndex + 1}`)
                              if (files.length === 0) return
                              event.preventDefault()
                              void handleUpdateBlockImageFiles(itemIndex, blockIndex, files)
                            }}
                          >
                            <p className="text-xs text-muted-foreground">
                              {locale === "zh"
                                ? "也可以直接把多张图片拖到这里，或者粘贴截图上传到当前图片组。"
                                : "You can also drag images here or paste screenshots into this grid."}
                            </p>
                            {blockUploadPreviews.length > 0 ? (
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                {blockUploadPreviews.map((preview) => (
                                  <div key={`${blockUploadKey}-${preview.src}`} className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/70">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview.src} alt={preview.label} className="aspect-square w-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-3">
                            <p className="text-sm text-foreground">{locale === "zh" ? "批量粘贴图片说明" : "Paste image captions in bulk"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {locale === "zh" ? "每行一条，对应当前图片组的 alt 文本。" : "One line per image, applied to the current grid as alt text."}
                            </p>
                            <Textarea
                              className="mt-3 min-h-24"
                              placeholder={locale === "zh" ? "第一张图说明\n第二张图说明\n第三张图说明" : "Caption for image 1\nCaption for image 2\nCaption for image 3"}
                              value={updateCaptionDrafts[blockUploadKey] ?? ""}
                              onChange={(event) =>
                                setUpdateCaptionDrafts((current) => ({
                                  ...current,
                                  [blockUploadKey]: event.target.value,
                                }))
                              }
                            />
                            <div className="mt-3">
                              <Button variant="outline" onClick={() => applyUpdateBlockImageAltDrafts(itemIndex, blockIndex, updateCaptionDrafts[blockUploadKey] ?? "")}>
                                {locale === "zh" ? "应用说明" : "Apply captions"}
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {block.images.map((image, imageIndex) => (
                              <div
                                key={`${blockKey}-image-${imageIndex}`}
                                ref={(node) => {
                                  studioFocusRefs.current[`update-image-${itemIndex}-${blockIndex}-${imageIndex}`] = node
                                }}
                                tabIndex={-1}
                                className="rounded-2xl border border-border/70 bg-background/70 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    {locale === "zh" ? `图片 ${imageIndex + 1}` : `Image ${imageIndex + 1}`}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => moveUpdateBlockImage(itemIndex, blockIndex, imageIndex, -1)}
                                      disabled={imageIndex === 0}
                                    >
                                      {String(copy.moveUp)}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => moveUpdateBlockImage(itemIndex, blockIndex, imageIndex, 1)}
                                      disabled={imageIndex === block.images.length - 1}
                                    >
                                      {String(copy.moveDown)}
                                    </Button>
                                    <Button variant="outline" onClick={() => removeUpdateBlockImage(itemIndex, blockIndex, imageIndex)}>
                                      {String(copy.removeItem)}
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                  <label className="text-sm text-muted-foreground">
                                    {locale === "zh" ? "图片路径" : "Image path"}
                                    <Input
                                      value={image.src}
                                      onChange={(event) => updateUpdateBlockImage(itemIndex, blockIndex, imageIndex, "src", event.target.value)}
                                      className="mt-2"
                                    />
                                  </label>
                                  <label className="text-sm text-muted-foreground">
                                    {locale === "zh" ? "图片说明" : "Alt text"}
                                    <Input
                                      value={image.alt}
                                      onChange={(event) => updateUpdateBlockImage(itemIndex, blockIndex, imageIndex, "alt", event.target.value)}
                                      className="mt-2"
                                    />
                                  </label>
                                </div>
                                {image.src ? (
                                  <div className="mt-3 overflow-hidden rounded-[1rem] border border-border/70 bg-card/55">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={image.src} alt={image.alt} className="aspect-square w-full object-cover" />
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>

                          <div className="mt-3">
                            <Button variant="outline" onClick={() => addUpdateBlockImage(itemIndex, blockIndex)}>
                              {locale === "zh" ? "新增图片" : "Add image"}
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={blockKey} className="rounded-[1.2rem] border border-dashed border-border/70 bg-card/45 p-4 text-sm text-muted-foreground">
                        {locale === "zh" ? "这个内容块类型暂时无法可视化编辑，请在下方 JSON 中修改。" : "This block type is not yet available in the visual editor. Please edit it in the JSON area below."}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function getGalleryGroups() {
    if (selectedDataEntry?.key !== "gallery") return []

    const value = getValueAtPath(dataValue, "groups")
    if (!Array.isArray(value)) return []

    return value.filter((item): item is StudioGalleryGroup => isStudioGalleryGroup(item))
  }

  function updateGalleryGroup(groupIndex: number, field: keyof StudioGalleryGroup, nextValue: StudioDataNode) {
    updateDataField(`groups.${groupIndex}.${field}`, nextValue)
  }

  function addGalleryGroup() {
    updateDataValue((current) =>
      mutateArrayAtPath(current, "groups", (items) => {
        items.push({
          slug: "",
          title: locale === "zh" ? "新图集" : "New gallery",
          description: "",
          caption: "",
          cover: "",
          photos: [],
        })
      }),
    )
  }

  function addGalleryPhoto(groupIndex: number, photo?: StudioGalleryPhoto) {
    updateDataValue((current) =>
      mutateArrayAtPath(current, `groups.${groupIndex}.photos`, (items) => {
        items.push(photo ?? { src: "", alt: "", caption: "", videoSrc: "" })
      }),
    )
  }

  function updateGalleryPhoto(groupIndex: number, photoIndex: number, field: keyof StudioGalleryPhoto, nextValue: string) {
    updateDataField(`groups.${groupIndex}.photos.${photoIndex}.${field}`, nextValue)
  }

  function removeGalleryPhoto(groupIndex: number, photoIndex: number) {
    removeArrayItem(`groups.${groupIndex}.photos`, photoIndex)
  }

  function moveGalleryPhoto(groupIndex: number, photoIndex: number, direction: -1 | 1) {
    moveArrayItem(`groups.${groupIndex}.photos`, photoIndex, direction)
  }

  function setGalleryCoverFromPhoto(groupIndex: number, photoSrc: string) {
    updateGalleryGroup(groupIndex, "cover", photoSrc)
  }

  function moveGalleryPhotoToIndex(groupIndex: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return

    updateDataValue((current) =>
      mutateArrayAtPath(current, `groups.${groupIndex}.photos`, (items) => {
        if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return
        const [item] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, item)
      }),
    )
  }

  function applyGalleryPhotoCaptions(groupIndex: number, rawValue: string) {
    const captions = rawValue
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)

    updateDataValue((current) => {
      const nextValue = deepClone(current)
      const photosValue = getValueAtPath(nextValue, `groups.${groupIndex}.photos`)
      if (!Array.isArray(photosValue)) return current

      photosValue.forEach((photo, photoIndex) => {
        if (!isStudioGalleryPhoto(photo)) return
        photo.caption = captions[photoIndex] ?? photo.caption ?? ""
      })

      return nextValue
    })

    setDataStatus(locale === "zh" ? "已批量更新图片说明。" : "Photo captions updated in bulk.")
  }

  async function handleGalleryFiles(groupIndex: number, files: File[]) {
    if (files.length === 0 || selectedDataEntry?.key !== "gallery") {
      return
    }

    const groups = getGalleryGroups()
    const group = groups[groupIndex]
    if (!group || !selectedDataEntry.locale) {
      return
    }
    const existingPhotoCount = group.photos?.length ?? 0

    const uploadKey = `gallery-upload-${groupIndex}`
    setGalleryUploadPending(true)
    setGalleryUploadPreviewKey(uploadKey)
    replaceGalleryUploadPreview(uploadKey, createLocalPreviews(files))

    try {
      const targetSlug = group.slug.trim() || `gallery-group-${groupIndex + 1}`
      const assets = await uploadStudioAssets(files, selectedDataEntry.locale, "gallery", targetSlug)
      const nextCover = group.cover || assets[0]?.url || ""

      for (const asset of assets) {
        addGalleryPhoto(groupIndex, {
          src: asset.url,
          alt: deriveAssetLabel(asset.name),
          caption: "",
        })
      }

      if (nextCover) {
        setGalleryCoverFromPhoto(groupIndex, nextCover)
      }

      setDataStatus(locale === "zh" ? "图片已上传并回填到图集。" : "Images uploaded and inserted into the gallery.")
      focusStudioTarget(`gallery-photo-${groupIndex}-${existingPhotoCount + assets.length - 1}`)
    } catch (error) {
      setDataStatus(error instanceof Error ? error.message : locale === "zh" ? "上传图片失败。" : "Failed to upload images.")
    } finally {
      clearGalleryUploadPreview(uploadKey)
      setGalleryUploadPreviewKey((current) => (current === uploadKey ? null : current))
      setGalleryUploadPending(false)
    }
  }

  async function handleGalleryUpload(groupIndex: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => isImageFile(file))
    event.target.value = ""
    await handleGalleryFiles(groupIndex, files)
  }

  async function handleGalleryVideoUpload(groupIndex: number, photoIndex: number, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => isVideoFile(file))
    event.target.value = ""

    if (files.length === 0 || selectedDataEntry?.key !== "gallery") return

    const groups = getGalleryGroups()
    const group = groups[groupIndex]
    const photo = group?.photos?.[photoIndex]
    if (!group || !photo || !selectedDataEntry.locale) return

    if (!photo.src.trim()) {
      setDataStatus(locale === "zh" ? "请先为这张图片设置封面图路径，再绑定实况视频。" : "Set an image path first, then attach a live video.")
      return
    }

    const pendingKey = `gallery-video-${groupIndex}-${photoIndex}`
    setGalleryVideoUploadPendingKey(pendingKey)

    try {
      const targetSlug = group.slug.trim() || `gallery-group-${groupIndex + 1}`
      const [asset] = await uploadStudioAssets([files[0]], selectedDataEntry.locale, "gallery", targetSlug)
      if (!asset) {
        throw new Error(locale === "zh" ? "未返回视频资源。" : "No uploaded video was returned.")
      }

      updateGalleryPhoto(groupIndex, photoIndex, "videoSrc", asset.url)
      setDataStatus(locale === "zh" ? "实况视频已上传并绑定到当前图片项。" : "Live video uploaded and attached to this photo.")
      focusStudioTarget(`gallery-photo-${groupIndex}-${photoIndex}`)
    } catch (error) {
      setDataStatus(error instanceof Error ? error.message : locale === "zh" ? "上传实况视频失败。" : "Failed to upload live video.")
    } finally {
      setGalleryVideoUploadPendingKey((current) => (current === pendingKey ? null : current))
    }
  }

  function renderGalleryEditor() {
    const groups = getGalleryGroups()
    if (groups.length === 0) {
      return (
        <div className="mt-6 rounded-[1.6rem] border border-border/70 bg-card/45 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base text-foreground">{locale === "zh" ? "相册工作台" : "Gallery editor"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === "zh" ? "当前还没有图集，先新建一个图集开始。" : "No gallery groups yet. Create one to get started."}
              </p>
            </div>
            <Button variant="outline" onClick={addGalleryGroup}>
              {locale === "zh" ? "新增图集" : "Add gallery"}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="mt-6 rounded-[1.6rem] border border-border/70 bg-card/45 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base text-foreground">{locale === "zh" ? "相册工作台" : "Gallery editor"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "zh"
                ? "在这里直接管理图集封面、图片顺序和上传回填，不必手改 JSON。"
                : "Manage covers, ordering, and image uploads here instead of editing JSON by hand."}
            </p>
          </div>
          <Button variant="outline" onClick={addGalleryGroup}>
            {locale === "zh" ? "新增图集" : "Add gallery"}
          </Button>
        </div>

        <div className="mt-5 space-y-5">
          {groups.map((group, groupIndex) => {
            const photos = group.photos ?? []
            const displayPhotos = photos.filter(hasGalleryPhotoSrc)
            const previewPhotos = getGalleryPreviewPhotos(group)
            const galleryUploadKey = `gallery-upload-${groupIndex}`
            const galleryPreviews = galleryUploadPreviews[galleryUploadKey] ?? []

            return (
              <div key={`gallery-group-${groupIndex}`} className="rounded-[1.4rem] border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{group.title || `${locale === "zh" ? "图集" : "Gallery"} ${groupIndex + 1}`}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {photos.length} {locale === "zh" ? "张图片" : "photos"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => moveArrayItem("groups", groupIndex, -1)} disabled={groupIndex === 0}>
                      {String(copy.moveUp)}
                    </Button>
                    <Button variant="outline" onClick={() => moveArrayItem("groups", groupIndex, 1)} disabled={groupIndex === groups.length - 1}>
                      {String(copy.moveDown)}
                    </Button>
                    <Button variant="outline" onClick={() => duplicateArrayItem("groups", groupIndex)}>
                      {String(copy.duplicate)}
                    </Button>
                    <Button variant="outline" onClick={() => removeArrayItem("groups", groupIndex)}>
                      {String(copy.removeItem)}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-muted-foreground">
                    {locale === "zh" ? "图集 Slug" : "Gallery slug"}
                    <Input value={group.slug} onChange={(event) => updateGalleryGroup(groupIndex, "slug", event.target.value)} className="mt-2" />
                  </label>
                  <label className="text-sm text-muted-foreground">
                    {locale === "zh" ? "图集标题" : "Gallery title"}
                    <Input value={group.title} onChange={(event) => updateGalleryGroup(groupIndex, "title", event.target.value)} className="mt-2" />
                  </label>
                  <label className="text-sm text-muted-foreground md:col-span-2">
                    {locale === "zh" ? "图集描述" : "Description"}
                    <Textarea value={group.description} onChange={(event) => updateGalleryGroup(groupIndex, "description", event.target.value)} className="mt-2 min-h-24" />
                  </label>
                  <label className="text-sm text-muted-foreground md:col-span-2">
                    {locale === "zh" ? "图集说明" : "Caption"}
                    <Textarea value={group.caption} onChange={(event) => updateGalleryGroup(groupIndex, "caption", event.target.value)} className="mt-2 min-h-24" />
                  </label>
                  <label className="text-sm text-muted-foreground md:col-span-2">
                    {locale === "zh" ? "封面图片路径" : "Cover image path"}
                    <Input value={group.cover ?? ""} onChange={(event) => updateGalleryGroup(groupIndex, "cover", event.target.value)} className="mt-2" />
                  </label>
                </div>

                {displayPhotos.length > 0 ? (
                  <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-card/45 p-4">
                    <p className="text-sm font-medium text-foreground">{locale === "zh" ? "可视化选择封面" : "Visual cover picker"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locale === "zh" ? "直接点击缩略图设为封面，不必靠路径判断。" : "Click a thumbnail to set it as the cover instead of relying on file paths."}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {displayPhotos.map((photo, photoIndex) => {
                        const isCover = group.cover === photo.src

                        return (
                          <button
                            key={`gallery-cover-picker-${groupIndex}-${photoIndex}-${photo.src}`}
                            type="button"
                            onClick={() => setGalleryCoverFromPhoto(groupIndex, photo.src)}
                            className={`overflow-hidden rounded-[1.1rem] border text-left transition-all ${
                              isCover
                                ? "border-primary bg-primary/5 shadow-[0_16px_40px_-28px_rgba(88,140,114,0.5)]"
                                : "border-border/70 bg-background/70 hover:border-primary/45"
                            }`}
                          >
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.src} alt={photo.alt} className="aspect-square w-full object-cover" />
                              <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/45 px-2 py-1 text-[11px] text-white">
                                {isCover ? (locale === "zh" ? "当前封面" : "Current cover") : locale === "zh" ? "设为封面" : "Set cover"}
                              </span>
                            </div>
                            <div className="px-3 py-3">
                              <p className="line-clamp-1 text-xs font-medium text-foreground">{photo.alt || `${locale === "zh" ? "图片" : "Photo"} ${photoIndex + 1}`}</p>
                              {photo.caption ? <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{photo.caption}</p> : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-[1.2rem] border border-border/70 bg-card/45 p-4">
                    <p className="text-sm font-medium text-foreground">{locale === "zh" ? "封面卡片预览" : "Cover card preview"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locale === "zh" ? "这里会同步显示外部相册页的三张错位封面效果。" : "This mirrors the stacked preview used on the public gallery page."}
                    </p>
                    <div className="relative mt-5 h-72">
                      {previewPhotos.map((photo, photoIndex) => {
                        const transforms = [
                          "left-2 top-6 -rotate-[8deg]",
                          "left-1/2 top-0 z-10 -translate-x-1/2",
                          "right-2 top-8 rotate-[8deg]",
                        ]

                        return (
                          <div
                            key={`gallery-preview-${groupIndex}-${photo.src}-${photoIndex}`}
                            className={`absolute w-[58%] overflow-hidden rounded-[1.3rem] border border-border/75 bg-secondary/40 shadow-[0_20px_50px_-36px_rgba(22,42,32,0.42)] ${transforms[photoIndex] ?? "left-1/2 top-4 -translate-x-1/2"}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.src} alt={photo.alt} className="aspect-[4/5] w-full object-cover" />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-border/70 bg-card/45 p-4">
                    <p className="text-sm font-medium text-foreground">{locale === "zh" ? "批量说明" : "Bulk captions"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locale === "zh" ? "每行一条说明，会依次填入当前图集的图片说明。" : "One caption per line. They will be applied to the current gallery in order."}
                    </p>
                    <Textarea
                      className="mt-3 min-h-40"
                      placeholder={locale === "zh" ? "第一张图说明\n第二张图说明\n第三张图说明" : "Caption for photo 1\nCaption for photo 2\nCaption for photo 3"}
                      value={galleryCaptionDrafts[groupIndex] ?? ""}
                      onChange={(event) =>
                        setGalleryCaptionDrafts((current) => ({
                          ...current,
                          [groupIndex]: event.target.value,
                        }))
                      }
                    />
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => applyGalleryPhotoCaptions(groupIndex, galleryCaptionDrafts[groupIndex] ?? "")}>
                        {locale === "zh" ? "应用说明" : "Apply captions"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    studioFocusRefs.current[`gallery-dropzone-${groupIndex}`] = node
                  }}
                  tabIndex={0}
                  className="mt-5 rounded-[1.2rem] border border-border/70 bg-card/45 p-4"
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "copy"
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const files = Array.from(event.dataTransfer.files ?? []).filter((file) => isImageFile(file))
                    void handleGalleryFiles(groupIndex, files)
                  }}
                  onPaste={(event) => {
                    const files = getPastedImageFiles(event, `gallery-${groupIndex + 1}`)
                    if (files.length === 0) return
                    event.preventDefault()
                    void handleGalleryFiles(groupIndex, files)
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{locale === "zh" ? "图集图片" : "Gallery photos"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {locale === "zh"
                          ? "支持上传、排序、设封面，也可以直接拖入多张图片或粘贴截图。单张图片还可额外绑定一个短视频，形成网页实况图。"
                          : "Upload, reorder, set covers, drag multiple images here, or paste screenshots directly. Attach a short video to one photo to simulate a live photo."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => galleryUploadInputRefs.current[galleryUploadKey]?.click()} disabled={galleryUploadPending}>
                        {galleryUploadPending ? (locale === "zh" ? "上传中..." : "Uploading...") : locale === "zh" ? "上传图片" : "Upload images"}
                      </Button>
                      <Button variant="outline" onClick={() => addGalleryPhoto(groupIndex)}>
                        {locale === "zh" ? "新增图片项" : "Add photo"}
                      </Button>
                    </div>
                    <input
                      ref={(node) => {
                        galleryUploadInputRefs.current[galleryUploadKey] = node
                      }}
                      type="file"
                      accept="image/*,.heic"
                      multiple
                      className="hidden"
                      onChange={(event) => void handleGalleryUpload(groupIndex, event)}
                    />
                  </div>

                  {galleryPreviews.length > 0 ? (
                    <div className="mt-4 rounded-[1rem] border border-dashed border-border/70 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">
                        {galleryUploadPreviewKey === galleryUploadKey
                          ? locale === "zh"
                            ? "正在上传这些图片..."
                            : "Uploading these images..."
                          : locale === "zh"
                            ? "本地预览"
                            : "Local preview"}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {galleryPreviews.map((preview) => (
                          <div key={`${galleryUploadKey}-${preview.src}`} className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/70">
                            {preview.kind === "video" ? (
                              <video src={preview.src} muted playsInline preload="metadata" className="aspect-square w-full bg-black object-contain" />
                            ) : (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview.src} alt={preview.label} className="aspect-square w-full object-cover" />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {photos.map((photo, photoIndex) => (
                      <div
                        key={`gallery-photo-${groupIndex}-${photoIndex}`}
                        ref={(node) => {
                          studioFocusRefs.current[`gallery-photo-${groupIndex}-${photoIndex}`] = node
                        }}
                        tabIndex={-1}
                        className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", String(photoIndex))
                          event.dataTransfer.effectAllowed = "move"
                        }}
                        onDragOver={(event) => {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = "move"
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          const fromIndex = Number(event.dataTransfer.getData("text/plain"))
                          if (Number.isNaN(fromIndex)) return
                          moveGalleryPhotoToIndex(groupIndex, fromIndex, photoIndex)
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">
                            {locale === "zh" ? `图片 ${photoIndex + 1}` : `Photo ${photoIndex + 1}`}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border border-border/70 px-2 py-1 text-[11px] text-muted-foreground">
                              {locale === "zh" ? "拖拽排序" : "Drag to sort"}
                            </span>
                            <Button variant="outline" onClick={() => moveGalleryPhoto(groupIndex, photoIndex, -1)} disabled={photoIndex === 0}>
                              {String(copy.moveUp)}
                            </Button>
                            <Button variant="outline" onClick={() => moveGalleryPhoto(groupIndex, photoIndex, 1)} disabled={photoIndex === photos.length - 1}>
                              {String(copy.moveDown)}
                            </Button>
                            <Button variant="outline" onClick={() => setGalleryCoverFromPhoto(groupIndex, photo.src)}>
                              {locale === "zh" ? "设为封面" : "Set as cover"}
                            </Button>
                            <Button variant="outline" onClick={() => removeGalleryPhoto(groupIndex, photoIndex)}>
                              {String(copy.removeItem)}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3">
                          <label className="text-sm text-muted-foreground">
                            {locale === "zh" ? "图片路径" : "Image path"}
                            <Input value={photo.src} onChange={(event) => updateGalleryPhoto(groupIndex, photoIndex, "src", event.target.value)} className="mt-2" />
                          </label>
                          <label className="text-sm text-muted-foreground">
                            {locale === "zh" ? "替代文本" : "Alt text"}
                            <Input value={photo.alt} onChange={(event) => updateGalleryPhoto(groupIndex, photoIndex, "alt", event.target.value)} className="mt-2" />
                          </label>
                          <label className="text-sm text-muted-foreground">
                            {locale === "zh" ? "图片说明" : "Caption"}
                            <Textarea
                              value={photo.caption ?? ""}
                              onChange={(event) => updateGalleryPhoto(groupIndex, photoIndex, "caption", event.target.value)}
                              className="mt-2 min-h-24"
                            />
                          </label>
                          <label className="text-sm text-muted-foreground">
                            {locale === "zh" ? "实况视频路径" : "Live video path"}
                            <Input
                              value={photo.videoSrc ?? ""}
                              onChange={(event) => updateGalleryPhoto(groupIndex, photoIndex, "videoSrc", event.target.value)}
                              className="mt-2"
                              placeholder="/uploads/.../clip.mp4"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => galleryVideoUploadInputRefs.current[`gallery-video-${groupIndex}-${photoIndex}`]?.click()}
                              disabled={galleryVideoUploadPendingKey === `gallery-video-${groupIndex}-${photoIndex}`}
                            >
                              {galleryVideoUploadPendingKey === `gallery-video-${groupIndex}-${photoIndex}`
                                ? locale === "zh"
                                  ? "上传视频中..."
                                  : "Uploading video..."
                                : locale === "zh"
                                  ? "上传实况视频"
                                  : "Upload live video"}
                            </Button>
                            <input
                              ref={(node) => {
                                galleryVideoUploadInputRefs.current[`gallery-video-${groupIndex}-${photoIndex}`] = node
                              }}
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                              className="hidden"
                              onChange={(event) => void handleGalleryVideoUpload(groupIndex, photoIndex, event)}
                            />
                            {photo.videoSrc ? (
                              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                                {locale === "zh" ? "已绑定实况视频" : "Live video attached"}
                              </span>
                            ) : null}
                          </div>
                          {photo.src ? (
                            <div className="overflow-hidden rounded-[1rem] border border-border/70 bg-card/55">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.src} alt={photo.alt} className="aspect-[4/5] w-full object-cover" />
                            </div>
                          ) : null}
                          {photo.videoSrc ? (
                            <div className="overflow-hidden rounded-[1rem] border border-border/70 bg-card/55">
                              <video src={photo.videoSrc} controls preload="metadata" className="aspect-[4/5] w-full bg-black object-contain" />
                            </div>
                          ) : null}
                          {group.cover === photo.src ? (
                            <p className="text-xs text-[color:var(--primary)]">{locale === "zh" ? "当前封面" : "Current cover"}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  async function saveItem(nextDraft?: boolean) {
    if (!selectedKey || savePending || studioReadOnly) return

    const [itemLocale, itemSection, itemSlug] = selectedKey.split("/") as [StudioLocale, StudioSection, string]
    const draftMeta = typeof nextDraft === "boolean" ? { ...meta, draft: nextDraft } : meta
    const nextMeta = withAutomaticContentMeta(itemSection, draftMeta, body)

    setSavePending(true)
    setContentRegenerating(runtimeInfo.backend === "filesystem")
    setStatus(
      runtimeInfo.backend === "github"
        ? locale === "zh"
          ? "正在保存并提交到 GitHub..."
          : "Saving and committing to GitHub..."
        : locale === "zh"
          ? "正在保存并刷新内容索引..."
          : "Saving and refreshing the content index...",
    )

    try {
      const response = await fetch("/api/studio/item", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: itemLocale,
          section: itemSection,
          slug: itemSlug,
          meta: nextMeta,
          body,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus(data.error ?? String(copy.saveFailed))
        return
      }

      setSelectedKey(`${data.locale}/${data.section}/${data.slug}`)
      setMeta(data.meta ?? {})
      setBody(data.body ?? "")
      setSavedItemSnapshot(serializeStudioItemState(data.meta ?? {}, data.body ?? ""))
      setLastContentSavedAt(formatStudioTime(locale, new Date()))
      setStatus(data.regenerated ? String(copy.savedAndMoved) : String(copy.saved))
      await loadItems()
      await loadReferences()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(copy.saveFailed))
    } finally {
      setContentRegenerating(false)
      setSavePending(false)
    }
  }

  async function deleteItem() {
    if (!selectedKey || deletePending || studioReadOnly) return

    const [itemLocale, itemSection, itemSlug] = selectedKey.split("/") as [StudioLocale, StudioSection, string]
    const confirmMessage =
      typeof copy.deleteConfirm === "string"
        ? copy.deleteConfirm.replace("{value}", itemSlug)
        : `Delete ${itemSlug}? This cannot be undone.`

    if (!window.confirm(confirmMessage)) return

    setDeletePending(true)

    try {
      const response = await fetch(`/api/studio/item?locale=${itemLocale}&section=${itemSection}&slug=${itemSlug}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus(data.error ?? String(copy.deleteFailed ?? "Delete failed."))
        return
      }

      setSelectedKey(null)
      setMeta({})
      setBody("")
      setPreviewHtml("")
      setPreviewError("")
      setStatus(String(copy.deleted ?? "Deleted."))
      await loadItems()
      await loadReferences()
    } finally {
      setDeletePending(false)
    }
  }

  async function createItemWithSource(options?: {
    locale?: StudioLocale
    section?: StudioSection
    slug?: string
    source?: string
  }) {
    if (studioReadOnly) return

    const targetLocale = options?.locale ?? newLocale
    const targetSection = options?.section ?? newSection
    const slug = (options?.slug ?? newSlug).trim()

    if (!slug) {
      setStatus(String(copy.slugRequired))
      return
    }

    setCreatePending(true)

    try {
      const response = await fetch("/api/studio/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: targetLocale,
          section: targetSection,
          slug,
          source: options?.source,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus(data.error ?? String(copy.createFailed))
        return
      }

      setNewSlug("")
      setStatus(resolveCopyMessage(copy.created, slug))
      await loadItems()
      await loadReferences()
      await openItem({
        locale: data.locale,
        section: data.section,
        slug: data.slug,
        title: data.title,
        draft: data.draft,
      })
    } finally {
      setCreatePending(false)
    }
  }

  async function saveDataItem() {
    if (!selectedDataKey || dataSavePending || studioReadOnly) return

    const [key, itemLocale] = selectedDataKey.split("/") as [StudioDataKey, StudioLocale]
    setDataSavePending(true)
    setDataStatus(
      runtimeInfo.backend === "github"
        ? locale === "zh"
          ? "正在保存结构化资料并提交到 GitHub..."
          : "Saving structured data and committing to GitHub..."
        : locale === "zh"
          ? "正在保存结构化资料..."
          : "Saving structured data...",
    )

    try {
      const parsedValue = JSON.parse(dataJsonDirty ? dataJson : serializedDataValue) as StudioDataValue
      const response = await fetch("/api/studio/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          locale: itemLocale,
          value: parsedValue,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setDataStatus(data.error ?? String(copy.dataSaveFailed))
        return
      }

      setDataValue(data.value ?? {})
      setDataJson(`${JSON.stringify(data.value ?? {}, null, 2)}\n`)
      setDataJsonDirty(false)
      setSavedDataSnapshot(normalizeSnapshotValue(`${JSON.stringify(data.value ?? {}, null, 2)}\n`))
      setLastDataSavedAt(formatStudioTime(locale, new Date()))
      setDataStatus(String(copy.dataSaved))
      await loadDataItems()
    } catch (error) {
      setDataStatus(error instanceof Error ? error.message : String(copy.dataSaveFailed))
    } finally {
      setDataSavePending(false)
    }
  }

  async function copyText(value: string, successMessage: string, target: "status" | "dataStatus" = "status") {
    try {
      await navigator.clipboard.writeText(value)

      if (target === "dataStatus") {
        setDataStatus(successMessage)
      } else {
        setStatus(successMessage)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(copy.copyFailed)

      if (target === "dataStatus") {
        setDataStatus(message)
      } else {
        setStatus(message)
      }
    }
  }

  async function signOutStudio() {
    setSignOutPending(true)
    setStatus(locale === "zh" ? "正在退出 Studio..." : "Signing out of Studio...")

    try {
      const response = await fetch("/api/studio/auth", { method: "DELETE" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setStatus(data.error ?? (locale === "zh" ? "退出失败。" : "Sign-out failed."))
        return
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(studioRecentContentStorageKey)
        window.localStorage.removeItem(studioRecentDataStorageKey)
        window.localStorage.removeItem(studioResumeContentStorageKey)
        window.location.reload()
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : locale === "zh" ? "退出失败。" : "Sign-out failed.")
    } finally {
      setSignOutPending(false)
    }
  }

  function createSiblingDraft(item: StudioItem) {
    setNewLocale(item.locale)
    setNewSection(item.section)
    setNewSlug(`${item.slug}-new`)
    setStatus(locale === "zh" ? "已填入同类内容草稿参数，确认后即可新建。" : "Draft settings filled. Confirm to create a sibling entry.")
  }

  async function uploadStudioAssets(
    files: File[],
    targetLocale: StudioLocale,
    targetSection: StudioAssetSection,
    targetSlug: string,
  ): Promise<ImportedStudioAsset[]> {
    if (studioReadOnly) {
      throw new Error(
        locale === "zh"
          ? "线上 Studio 当前是只读模式，请在本地工作区中上传资源。"
          : "The deployed Studio is currently read-only. Upload assets from the local workspace Studio instead.",
      )
    }

    if (files.length === 0) {
      return []
    }

    const formData = new FormData()
    formData.set("locale", targetLocale)
    formData.set("section", targetSection)
    formData.set("slug", targetSlug)

    for (const file of files) {
      formData.append("files", file)
    }

    const response = await fetch("/api/studio/assets", {
      method: "POST",
      body: formData,
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to upload media attachments.")
    }

    return Array.isArray(data.assets) ? (data.assets as ImportedStudioAsset[]) : []
  }

  async function uploadImportedAssets(
    files: File[],
    targetLocale: StudioLocale,
    targetSection: StudioSection,
    targetSlug: string,
  ): Promise<ImportedStudioAsset[]> {
    return uploadStudioAssets(files, targetLocale, targetSection, targetSlug)
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    if (studioReadOnly) {
      event.target.value = ""
      setStatus(
        locale === "zh"
          ? "线上 Studio 当前是只读模式，请在本地工作区中导入并编辑内容。"
          : "The deployed Studio is currently read-only. Import and edit content from the local workspace Studio instead.",
      )
      return
    }

    const allFiles = Array.from(event.target.files ?? [])
    if (allFiles.length === 0) return

    const contentFile = allFiles.find((file) => isMarkdownFile(file))
    if (!contentFile) {
      setStatus(locale === "zh" ? "请至少选择一个 Markdown 或 MDX 文件。" : "Please choose at least one Markdown or MDX file.")
      event.target.value = ""
      return
    }

    try {
      const source = await readFileText(contentFile)
      const imported = parseImportedStudioContent(source)
      const derivedSlug = deriveSlugFromFileName(contentFile.name)
      const importedLocale =
        imported.meta.locale === "zh" || imported.meta.locale === "en" ? (imported.meta.locale as StudioLocale) : newLocale
      const targetSection = selectedSection ?? newSection
      const targetSlug =
        typeof imported.meta.slug === "string" && imported.meta.slug.trim() ? imported.meta.slug : selectedKey ? selectedSlug : derivedSlug
      const imageFiles = allFiles.filter((file) => file !== contentFile && isImageFile(file))
      const uploadedAssets = await uploadImportedAssets(imageFiles, importedLocale, targetSection, targetSlug)
      const normalizedBody = normalizeImportedStudioBody(imported.body, uploadedAssets, references, importedLocale)

      if (!selectedKey) {
        const nextSlug = targetSlug
        const nextMeta = withAutomaticContentMeta(targetSection, {
          ...imported.meta,
          slug: nextSlug,
          locale: importedLocale,
          draft: typeof imported.meta.draft === "boolean" ? imported.meta.draft : true,
        }, normalizedBody)
        const sourceToCreate = createStudioSource(nextMeta, normalizedBody)

        setNewSlug(nextSlug)
        setNewLocale(importedLocale)
        setMeta(nextMeta)
        setBody(normalizedBody)
        await createItemWithSource({
          locale: importedLocale,
          section: targetSection,
          slug: nextSlug,
          source: sourceToCreate,
        })
      } else {
        const nextMeta = withAutomaticContentMeta(targetSection, {
          ...meta,
          ...imported.meta,
          slug: typeof imported.meta.slug === "string" ? imported.meta.slug : selectedSlug,
          locale: importedLocale,
        }, normalizedBody)

        setMeta(nextMeta)
        setBody(normalizedBody)
        setStatus(String(copy.importedFile))
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(copy.importFailed))
    } finally {
      event.target.value = ""
    }
  }

  const commonMetaFields = useMemo(() => {
    if (!selectedSection) return []

    if (selectedSection === "blog") {
      return ["title", "slug", "locale", "draft", "category", "date", "readingTime", "excerpt", "tags"]
    }

    if (selectedSection === "notes") {
      return ["title", "slug", "locale", "draft", "series", "date", "summary", "tags"]
    }

    return ["title", "slug", "locale", "draft", "period", "category", "status", "role", "summary", "outcome", "tags"]
  }, [selectedSection])

  const advancedMetaFields = useMemo(() => {
    if (!selectedSection) return []
    return Object.keys(meta).filter((key) => !commonMetaFields.includes(key))
  }, [commonMetaFields, meta, selectedSection])

  const filteredItems = useMemo(() => {
    const query = contentQuery.trim().toLowerCase()

    return items.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query) ||
        item.locale.toLowerCase().includes(query)

      if (!matchesQuery) return false

      if (contentStatusFilter === "draft" && !item.draft) return false
      if (contentStatusFilter === "published" && item.draft) return false

      if (contentLocaleFilter === "zh" || contentLocaleFilter === "en") {
        return item.locale === contentLocaleFilter
      }

      if (contentLocaleFilter === "current") {
        return item.locale === locale
      }

      return true
    })
  }, [contentLocaleFilter, contentQuery, contentStatusFilter, items, locale])

  const groupedItems = useMemo(
    () =>
      contentSectionOrder.map((section) => {
        const sectionItems = filteredItems
          .filter((item) => item.section === section)
          .sort((left, right) => {
            if (left.draft !== right.draft) return Number(left.draft) - Number(right.draft)
            if (left.locale !== right.locale) {
              if (left.locale === locale) return -1
              if (right.locale === locale) return 1
              return left.locale.localeCompare(right.locale)
            }
            return left.title.localeCompare(right.title)
          })

        return {
          section,
          published: sectionItems.filter((item) => !item.draft),
          drafts: sectionItems.filter((item) => item.draft),
        }
      }),
    [filteredItems, locale],
  )

  const sortedDataItems = useMemo(
    () =>
      [...dataItems].sort((left, right) => {
        const keyDelta = dataKeyOrder.indexOf(left.key) - dataKeyOrder.indexOf(right.key)
        if (keyDelta !== 0) return keyDelta

        if (left.locale !== right.locale) {
          if (left.locale === locale) return -1
          if (right.locale === locale) return 1
          return left.locale.localeCompare(right.locale)
        }

        return left.title.localeCompare(right.title)
      }),
    [dataItems, locale],
  )

  const filteredDataItems = useMemo(() => {
    const query = dataQuery.trim().toLowerCase()

    return sortedDataItems.filter((item) => {
      const matchesQuery =
        !query ||
        getDataLabel(item.key, locale).toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query)

      if (!matchesQuery) return false

      if (dataLocaleFilter === "zh" || dataLocaleFilter === "en") {
        return item.locale === dataLocaleFilter
      }

      if (dataLocaleFilter === "current") {
        return item.locale === locale
      }

      return true
    })
  }, [dataLocaleFilter, dataQuery, locale, sortedDataItems])

  const itemMap = useMemo(() => {
    return new Map(items.map((item) => [buildStudioItemKey(item.locale, item.section, item.slug), item]))
  }, [items])

  const dataItemMap = useMemo(() => {
    return new Map(dataItems.map((item) => [buildStudioDataItemKey(item.key, item.locale), item]))
  }, [dataItems])

  const recentContentItems = useMemo(() => {
    return recentContentKeys.map((key) => itemMap.get(key)).filter((item): item is StudioItem => Boolean(item))
  }, [itemMap, recentContentKeys])

  const recentDataItems = useMemo(() => {
    return recentDataKeys.map((key) => dataItemMap.get(key)).filter((item): item is StudioDataItem => Boolean(item))
  }, [dataItemMap, recentDataKeys])

  const resumableContentItem = useMemo(() => {
    if (!resumableContentKey) return null
    return itemMap.get(resumableContentKey) ?? null
  }, [itemMap, resumableContentKey])

  function renderPrimitiveField(path: string, label: string, value: StudioDataPrimitive) {
    if (typeof value === "boolean") {
      return (
        <div className="rounded-2xl border border-border/70 bg-card/45 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{value ? String(copy.yes) : String(copy.no)}</p>
            </div>
            <Switch checked={value} onCheckedChange={(checked) => updateDataField(path, checked)} />
          </div>
        </div>
      )
    }

    if (typeof value === "number") {
      return (
        <Input
          value={String(value)}
          onChange={(event) => updateDataField(path, Number(event.target.value || 0))}
          className="mt-2"
        />
      )
    }

    const stringValue = typeof value === "string" ? value : ""
    const useTextarea = stringValue.length > 100 || stringValue.includes("\n")

    return useTextarea ? (
      <Textarea value={stringValue} onChange={(event) => updateDataField(path, event.target.value)} className="mt-2 min-h-24" />
    ) : (
      <Input value={stringValue} onChange={(event) => updateDataField(path, event.target.value)} className="mt-2" />
    )
  }

  function renderObjectFields(objectPath: string, objectValue: Record<string, StudioDataNode>, depth = 0) {
    return (
      <div className={`grid gap-4 ${depth === 0 ? "md:grid-cols-2" : ""}`}>
        {Object.entries(objectValue).map(([key, value]) => {
          const path = objectPath ? `${objectPath}.${key}` : key
          const fieldLabel = getDataFieldLabel(copy, key)

          return (
            <div key={path} className="text-sm text-muted-foreground">
              <p>{fieldLabel}</p>
              {renderDataNode(path, fieldLabel, value, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  function renderObjectArray(path: string, label: string, value: Array<Record<string, StudioDataNode>>, depth = 0) {
    return (
      <div className="mt-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/45 px-4 py-3">
          <div>
            <p className="text-sm text-foreground">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {value.length} {String(copy.countLabel)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void copyText(JSON.stringify(value, null, 2), String(copy.copied), "dataStatus")}>
              {String(copy.copyList)}
            </Button>
            <Button variant="outline" onClick={() => addArrayItem(path)}>
              {String(copy.addItem)}
            </Button>
          </div>
        </div>

        {value.map((item, index) => {
          const collapseKey = path ? `${path}.${index}` : `${index}`
          const collapsed = Boolean(collapsedCards[collapseKey])
          const childPath = path ? `${path}.${index}` : String(index)

          return (
            <div key={collapseKey} className="rounded-[1.5rem] border border-border/70 bg-card/55 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{getObjectItemTitle(item, index)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">#{index + 1}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setCollapsedCards((current) => ({ ...current, [collapseKey]: !collapsed }))}>
                    {collapsed ? String(copy.expand) : String(copy.collapse)}
                  </Button>
                  <Button variant="outline" onClick={() => moveArrayItem(path, index, -1)} disabled={index === 0}>
                    {String(copy.moveUp)}
                  </Button>
                  <Button variant="outline" onClick={() => moveArrayItem(path, index, 1)} disabled={index === value.length - 1}>
                    {String(copy.moveDown)}
                  </Button>
                  <Button variant="outline" onClick={() => duplicateArrayItem(path, index)}>
                    {String(copy.duplicate)}
                  </Button>
                  <Button variant="outline" onClick={() => void copyText(JSON.stringify(item, null, 2), String(copy.copied), "dataStatus")}>
                    {String(copy.copyItem)}
                  </Button>
                  <Button variant="outline" onClick={() => removeArrayItem(path, index)}>
                    {String(copy.removeItem)}
                  </Button>
                </div>
              </div>

              {!collapsed ? <div className="mt-4">{renderObjectFields(childPath, item, depth + 1)}</div> : null}
            </div>
          )
        })}
      </div>
    )
  }

  function renderDataNode(path: string, label: string, value: StudioDataNode, depth = 0): ReactNode {
    if (Array.isArray(value)) {
      if (isArrayOfStrings(value)) {
        return (
          <div className="mt-2">
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => void copyText(value.join("\n"), String(copy.copied), "dataStatus")}>
                {String(copy.copyList)}
              </Button>
            </div>
            <Textarea
              value={formatLineSeparatedList(value)}
              onChange={(event) => updateDataField(path, parseLineSeparatedList(event.target.value))}
              className="min-h-28"
            />
            <p className="mt-2 text-xs text-muted-foreground">{String(copy.lineListHint)}</p>
          </div>
        )
      }

      if (isArrayOfObjects(value)) {
        return renderObjectArray(path, label, value, depth)
      }

      return (
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(event) => {
            try {
              updateDataField(path, JSON.parse(event.target.value) as StudioDataNode)
              setDataStatus("")
            } catch (error) {
              setDataStatus(error instanceof Error ? error.message : String(copy.dataSaveFailed))
            }
          }}
          className="mt-2 min-h-32 font-mono text-sm"
        />
      )
    }

    if (isPlainObject(value)) {
      return <div className="mt-2 rounded-2xl border border-border/70 bg-card/45 p-4">{renderObjectFields(path, value, depth)}</div>
    }

    return renderPrimitiveField(path, label, value)
  }

  return (
    <main className="pb-24">
      <section className="mx-auto max-w-6xl px-6 pt-16 md:px-10 md:pt-24">
        <PageIntro eyebrow={String(copy.eyebrow)} title={String(copy.title)} description={String(copy.description)} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant={mode === "content" ? "default" : "outline"} onClick={() => setMode("content")}>
              {String(copy.modeContent)}
            </Button>
            <Button variant={mode === "data" ? "default" : "outline"} onClick={() => setMode("data")}>
              {String(copy.modeData)}
            </Button>
            <span className="inline-flex h-10 items-center rounded-full border border-border/70 bg-card/55 px-4 text-sm text-muted-foreground">
              {studioAccessModeLabel}
            </span>
            <span className="inline-flex h-10 items-center rounded-full border border-border/70 bg-card/55 px-4 text-sm text-muted-foreground">
              {studioBackendLabel}
            </span>
          </div>
          {authConfigured ? (
            <Button variant="outline" onClick={() => void signOutStudio()} disabled={signOutPending}>
              {signOutPending ? (locale === "zh" ? "退出中..." : "Signing out...") : locale === "zh" ? "退出登录" : "Sign out"}
            </Button>
          ) : null}
        </div>
        {studioReadOnly ? (
          <div className="mt-6 rounded-[1.6rem] border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-amber-950/85 dark:text-amber-100/90">
            <p className="font-medium">{locale === "zh" ? "当前部署站点中的 Studio 为只读模式。" : "This deployed Studio is currently read-only."}</p>
            <p className="mt-2">
              {locale === "zh"
                ? "你现在可以查看已经发布到站点里的内容和结构化资料，但不能直接在网页端写回仓库文件。要编辑内容，请在本地工作区打开 Studio；如果后续要支持线上改内容，需要再接一个 Git 或数据库后端。"
                : "You can browse bundled content and structured data here, but edits cannot be written back from the deployed site. Use the local workspace Studio for editing, or add a Git/database backend before enabling web writes."}
            </p>
          </div>
        ) : null}
        {runtimeInfo.backend === "github" ? (
          <div className="mt-6 rounded-[1.6rem] border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-950/85 dark:text-emerald-100/90">
            <p className="font-medium">{locale === "zh" ? "当前 Studio 会直接把内容提交到 GitHub 仓库。" : "This Studio writes content directly back to GitHub."}</p>
            <p className="mt-2">
              {locale === "zh"
                ? `保存、删除、上传素材后，会提交到 ${runtimeInfo.repo ?? "your repo"}${runtimeInfo.branch ? ` 的 ${runtimeInfo.branch} 分支` : ""}，随后由 Vercel 自动重新部署。`
                : `Saves, deletes, and asset uploads will commit to ${runtimeInfo.repo ?? "your repo"}${runtimeInfo.branch ? ` on branch ${runtimeInfo.branch}` : ""}, then Vercel can redeploy automatically.`}
            </p>
          </div>
        ) : null}
      </section>

      {mode === "content" ? (
        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-[0.82fr_1.18fr] md:px-10">
          <div className="space-y-6">
            <div className="page-panel p-6">
              <h2 className="text-xl">{String(copy.newContent)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{String(copy.sectionDescriptions[newSection])}</p>
              <div className="mt-4 grid gap-3">
                <label className="text-sm text-muted-foreground">
                  {String(copy.locale)}
                  <select
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    value={newLocale}
                    onChange={(event) => setNewLocale(event.target.value as StudioLocale)}
                  >
                    <option value="zh">zh</option>
                    <option value="en">en</option>
                  </select>
                </label>
                <label className="text-sm text-muted-foreground">
                  {String(copy.section)}
                  <select
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    value={newSection}
                    onChange={(event) => setNewSection(event.target.value as StudioSection)}
                  >
                    <option value="blog">{String(copy.sectionLabels.blog)}</option>
                    <option value="notes">{String(copy.sectionLabels.notes)}</option>
                    <option value="projects">{String(copy.sectionLabels.projects)}</option>
                  </select>
                </label>
                <label className="text-sm text-muted-foreground">
                  {String(copy.slug)}
                  <Input value={newSlug} onChange={(event) => setNewSlug(event.target.value)} placeholder="new-entry-slug" className="mt-2" />
                </label>
                {!createSlugLooksGood ? <p className="text-xs text-amber-600">{String(copy.createSlugHint)}</p> : null}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void createItemWithSource()} disabled={createPending || studioReadOnly}>
                    {createPending ? String(copy.createPending) : String(copy.createDraft)}
                  </Button>
                  <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={studioReadOnly}>
                    {String(copy.importFile)}
                  </Button>
                  <Button variant="outline" onClick={() => void loadItems()}>
                    {String(copy.refresh)}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{String(copy.importHint)}</p>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".md,.mdx,text/markdown,text/plain,image/*"
                  multiple
                  className="hidden"
                  disabled={studioReadOnly}
                  onChange={(event) => void handleImportFile(event)}
                />
              </div>
            </div>

            <div className="page-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl">{locale === "zh" ? "快捷继续" : "Quick resume"}</h2>
                {resumableContentItem ? (
                  <Button variant="outline" onClick={() => void openItem(resumableContentItem)}>
                    {locale === "zh" ? "继续上次内容" : "Resume last item"}
                  </Button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4">
                {resumableContentItem ? (
                  <button
                    type="button"
                    onClick={() => void openItem(resumableContentItem)}
                    className="rounded-[1.4rem] border border-primary/25 bg-primary/5 px-4 py-4 text-left transition-colors hover:border-primary/45"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{locale === "zh" ? "上次编辑" : "Last edited"}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{resumableContentItem.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(copy.sectionLabels[resumableContentItem.section])} · {resumableContentItem.locale} · {resumableContentItem.slug}
                    </p>
                  </button>
                ) : (
                  <p className="rounded-[1.4rem] border border-border/70 bg-card/45 px-4 py-4 text-sm text-muted-foreground">
                    {locale === "zh" ? "还没有可继续的最近内容，先打开或新建一篇内容。" : "No resumable item yet. Open or create a content entry first."}
                  </p>
                )}

                {recentContentItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{locale === "zh" ? "最近编辑" : "Recent items"}</p>
                    <div className="grid gap-2">
                      {recentContentItems.slice(0, 5).map((item) => {
                        const key = buildStudioItemKey(item.locale, item.section, item.slug)
                        const isSelected = key === selectedKey

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => void openItem(item)}
                            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                              isSelected ? "border-primary/45 bg-primary/5" : "border-border/70 bg-card/45 hover:border-primary/35"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-foreground">{item.title}</span>
                              <span className="text-xs text-muted-foreground">{item.locale}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {String(copy.sectionLabels[item.section])} · {item.slug}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="page-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl">{String(copy.contentFiles)}</h2>
                <Button variant="outline" onClick={() => void loadItems()}>
                  {String(copy.refresh)}
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                <Input
                  value={contentQuery}
                  onChange={(event) => setContentQuery(event.target.value)}
                  placeholder={locale === "zh" ? "搜索标题、slug、栏目或语言" : "Search title, slug, section, or locale"}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-muted-foreground">
                    {locale === "zh" ? "发布状态" : "Status"}
                    <select
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      value={contentStatusFilter}
                      onChange={(event) => setContentStatusFilter(event.target.value as StudioContentStatusFilter)}
                    >
                      <option value="all">{locale === "zh" ? "全部" : "All"}</option>
                      <option value="published">{String(copy.published)}</option>
                      <option value="draft">{String(copy.draft)}</option>
                    </select>
                  </label>
                  <label className="text-sm text-muted-foreground">
                    {String(copy.locale)}
                    <select
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                      value={contentLocaleFilter}
                      onChange={(event) => setContentLocaleFilter(event.target.value as StudioLocaleFilter)}
                    >
                      <option value="current">{locale === "zh" ? "当前语言优先" : "Current locale"}</option>
                      <option value="all">{locale === "zh" ? "全部语言" : "All locales"}</option>
                      <option value="zh">zh</option>
                      <option value="en">en</option>
                    </select>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === "zh"
                    ? `当前共显示 ${filteredItems.length} / ${items.length} 条内容。`
                    : `Showing ${filteredItems.length} of ${items.length} content items.`}
                </p>
              </div>
              <div className="mt-4 space-y-5">
                {groupedItems.map((group) => {
                  const groups = [
                    { label: String(copy.published), items: group.published },
                    { label: String(copy.draft), items: group.drafts },
                  ].filter((itemGroup) => itemGroup.items.length > 0)

                  return (
                    <div key={group.section} className="rounded-[1.5rem] border border-border/70 bg-card/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base text-foreground">{String(copy.sectionLabels[group.section])}</h3>
                        <span className="text-xs text-muted-foreground">
                          {group.published.length + group.drafts.length}
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        {groups.length > 0 ? (
                          groups.map((itemGroup) => (
                            <div key={`${group.section}-${itemGroup.label}`} className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{itemGroup.label}</p>
                              <div className="grid gap-3">
                                {itemGroup.items.map((item) => {
                                  const key = `${item.locale}/${item.section}/${item.slug}`
                                  const isSelected = key === selectedKey
                                  const itemPublicPath = getPublicPath(item.section, item.slug)
                                  const itemFilePath = getStudioFilePath(item.locale, item.section, item.slug)

                                  return (
                                    <div
                                      key={key}
                                      className={`rounded-2xl border px-4 py-3 transition-colors ${
                                        isSelected
                                          ? "border-primary/50 bg-primary/5"
                                          : "border-border/70 bg-card/65 hover:border-primary/50"
                                      }`}
                                    >
                                      <button type="button" onClick={() => void openItem(item)} className="block w-full text-left">
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-sm font-medium">{item.title}</span>
                                          <span className="text-xs text-muted-foreground">{item.locale}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">{item.slug}</p>
                                      </button>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => void copyText(item.slug, String(copy.copied))}>
                                          {locale === "zh" ? "复制 slug" : "Copy slug"}
                                        </Button>
                                        <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => void copyText(itemFilePath, String(copy.copied))}>
                                          {locale === "zh" ? "复制路径" : "Copy path"}
                                        </Button>
                                        <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => createSiblingDraft(item)}>
                                          {locale === "zh" ? "同类新建" : "New sibling"}
                                        </Button>
                                        {itemPublicPath ? (
                                          <Link
                                            href={itemPublicPath}
                                            className="inline-flex h-8 items-center rounded-full border border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground"
                                          >
                                            {locale === "zh" ? "打开公开页" : "Open page"}
                                          </Link>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {contentQuery || contentStatusFilter !== "all" || contentLocaleFilter !== "all"
                              ? locale === "zh"
                                ? "当前筛选条件下没有内容。"
                                : "No content matches the current filters."
                              : locale === "zh"
                                ? "该分组下还没有内容。"
                                : "No content in this section yet."}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="page-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl">{String(copy.metadata)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedKey ?? String(copy.openEmptyHint)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{status}</p>
                    {selectedKey ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {contentDirty
                          ? locale === "zh"
                            ? "有未保存修改"
                            : "Unsaved changes"
                          : lastContentSavedAt
                            ? locale === "zh"
                              ? `上次保存：${lastContentSavedAt}`
                              : `Last saved: ${lastContentSavedAt}`
                            : locale === "zh"
                              ? "尚未保存"
                              : "Not saved yet"}
                        {contentRegenerating ? ` · ${locale === "zh" ? "正在刷新索引" : "Refreshing index"}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <Button variant="outline" onClick={() => void deleteItem()} disabled={!selectedKey || savePending || deletePending || studioReadOnly}>
                    {deletePending ? String(copy.savePending) : String(copy.deleteContent ?? (locale === "zh" ? "删除" : "Delete"))}
                  </Button>
                  <Button variant="outline" onClick={() => void saveItem(true)} disabled={!selectedKey || savePending || studioReadOnly}>
                    {String(copy.revertToDraft)}
                  </Button>
                  <Button variant="outline" onClick={() => void saveItem(false)} disabled={!selectedKey || savePending || studioReadOnly}>
                    {String(copy.publish)}
                  </Button>
                  <Button onClick={() => void saveItem()} disabled={!selectedKey || savePending || studioReadOnly}>
                    {savePending ? String(copy.savePending) : String(copy.save)}
                  </Button>
                </div>
              </div>

              {selectedKey ? (
                <>
                  <div className={`mt-5 rounded-2xl border px-4 py-4 ${contentSummaryTone}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {contentDirty
                            ? locale === "zh"
                              ? "当前有未保存修改"
                              : "Unsaved changes in progress"
                            : locale === "zh"
                              ? "当前内容状态正常"
                              : "Content state is up to date"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {contentDirty
                            ? locale === "zh"
                              ? "建议先保存，再切换到其他内容或离开页面。"
                              : "Save before switching items or leaving the page."
                            : contentRegenerating
                              ? locale === "zh"
                                ? "内容索引正在刷新，完成后列表会自动更新。"
                                : "The content index is refreshing and the list will update automatically."
                              : locale === "zh"
                                ? "当前编辑内容已经和磁盘状态同步。"
                                : "The current content is synced with disk state."}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{selectedDraft ? String(copy.draft) : String(copy.published)}</p>
                        <p className="mt-1">{lastContentSavedAt ? `${locale === "zh" ? "最近保存" : "Saved at"} ${lastContentSavedAt}` : locale === "zh" ? "尚未保存" : "Not saved yet"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-border/70 bg-card/55 px-4 py-3 text-sm text-muted-foreground">
                    {selectedDraft ? String(copy.draftNotice) : String(copy.publishedNotice)}
                  </div>
                  <div className="mt-4 grid gap-2 rounded-2xl border border-border/70 bg-card/45 px-4 py-4 text-sm text-muted-foreground">
                    <p>
                      {String(copy.sectionHintPrefix)}
                      {selectedSection ? String(copy.sectionLabels[selectedSection]) : ""}
                    </p>
                    {publicPath ? (
                      <p>
                        {String(copy.publicPath)}: <span className="font-mono text-foreground">{publicPath}</span>
                      </p>
                    ) : null}
                    <p>{String(copy.fileMoveHint)}</p>
                    {!slugLooksGood ? <p className="text-amber-600">{String(copy.duplicateSlugHint)}</p> : null}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base">{String(copy.metadataCommon)}</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {commonMetaFields.map((fieldKey) => (
                        <label key={fieldKey} className="text-sm text-muted-foreground">
                          {getMetaFieldLabel(copy, fieldKey)}
                          {fieldKey === "draft" ? (
                            <div className="mt-2 rounded-2xl border border-border/70 bg-card/45 px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm text-foreground">{String(copy.draftField)}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{selectedDraft ? String(copy.draft) : String(copy.published)}</p>
                                </div>
                                <Switch checked={selectedDraft} onCheckedChange={(checked) => updateMetaField("draft", checked)} />
                              </div>
                            </div>
                          ) : fieldKey === "locale" ? (
                            <select
                              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                              value={selectedLocale}
                              onChange={(event) => updateMetaField("locale", event.target.value as StudioLocale)}
                            >
                              <option value="zh">zh</option>
                              <option value="en">en</option>
                            </select>
                          ) : fieldKey === "excerpt" || fieldKey === "summary" || fieldKey === "outcome" ? (
                            <Textarea
                              value={typeof meta[fieldKey] === "string" ? String(meta[fieldKey]) : ""}
                              onChange={(event) => updateMetaField(fieldKey, event.target.value)}
                              className="mt-2 min-h-28"
                            />
                          ) : fieldKey === "tags" ? (
                            <Input
                              value={formatCommaSeparatedList(meta.tags)}
                              onChange={(event) => updateMetaField("tags", parseCommaSeparatedList(event.target.value))}
                              className="mt-2"
                            />
                          ) : (
                            <Input
                              value={typeof meta[fieldKey] === "string" ? String(meta[fieldKey]) : ""}
                              onChange={(event) => updateMetaField(fieldKey, event.target.value)}
                              className="mt-2"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{String(copy.tagsHint)}</p>
                  </div>

                  {advancedMetaFields.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-base">{String(copy.metadataAdvanced)}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{String(copy.advancedHint)}</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {advancedMetaFields.map((fieldKey) => (
                          <label key={fieldKey} className="text-sm text-muted-foreground">
                            {fieldKey}
                            <Textarea
                              value={stringifyValue(meta[fieldKey])}
                              onChange={(event) => updateMetaField(fieldKey, parseLooseValue(event.target.value))}
                              className="mt-2 min-h-24 font-mono text-sm"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">{String(copy.metadataEmptyHint)}</p>
              )}
            </div>

            <div className="page-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">{String(copy.body)}</h2>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={studioReadOnly}>
                    {String(copy.replaceWithFile)}
                  </Button>
                  <Button variant="outline" onClick={() => void copyText(body, String(copy.copied))} disabled={!body}>
                    {String(copy.copySource)}
                  </Button>
                </div>
              </div>
              <Textarea
                value={body}
                onChange={(event) => {
                  if (studioReadOnly) return
                  setBody(event.target.value)
                }}
                placeholder={String(copy.bodyPlaceholder)}
                className="mt-5 min-h-[360px] font-mono text-sm"
                readOnly={studioReadOnly}
              />
              <p className="mt-2 text-xs text-muted-foreground">{String(copy.importBodyOnlyHint)}</p>
            </div>

            <div className="page-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">{String(copy.preview)}</h2>
                {publicPath ? (
                  <Link href={publicPath} className="text-sm underline decoration-border underline-offset-4">
                    {String(copy.openPublicPage)}
                  </Link>
                ) : null}
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-card/65 p-5">
                {previewPending ? <p className="text-sm text-muted-foreground">{String(copy.renderingPreview)}</p> : null}
                {!previewPending && previewError ? <p className="text-sm text-destructive">{previewError}</p> : null}
                {!previewPending && !previewError && previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : null}
                {!previewPending && !previewError && !previewHtml ? <p className="text-sm text-muted-foreground">{String(copy.previewEmptyHint)}</p> : null}
              </div>
            </div>

            <div className="page-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">{String(copy.generatedSource)}</h2>
                <Button variant="outline" onClick={() => void copyText(generatedSource, String(copy.copied))} disabled={!generatedSource}>
                  {String(copy.copySource)}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{String(copy.rawSourceHint)}</p>
              <Textarea value={generatedSource} readOnly className="mt-5 min-h-[260px] font-mono text-xs" />
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-[0.78fr_1.22fr] md:px-10">
          <div className="space-y-6">
            <div className="page-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl">{String(copy.dataEntries)}</h2>
                <Button variant="outline" onClick={() => void loadDataItems()}>
                  {String(copy.refresh)}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{String(copy.dataIntro)}</p>
              <div className="mt-4 grid gap-3">
                <Input
                  value={dataQuery}
                  onChange={(event) => setDataQuery(event.target.value)}
                  placeholder={locale === "zh" ? "搜索资料名称、说明或键名" : "Search label, summary, or key"}
                />
                <label className="text-sm text-muted-foreground">
                  {String(copy.locale)}
                  <select
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                    value={dataLocaleFilter}
                    onChange={(event) => setDataLocaleFilter(event.target.value as StudioLocaleFilter)}
                  >
                    <option value="current">{locale === "zh" ? "当前语言优先" : "Current locale"}</option>
                    <option value="all">{locale === "zh" ? "全部语言" : "All locales"}</option>
                    <option value="zh">zh</option>
                    <option value="en">en</option>
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  {locale === "zh"
                    ? `当前共显示 ${filteredDataItems.length} / ${dataItems.length} 条资料。`
                    : `Showing ${filteredDataItems.length} of ${dataItems.length} data entries.`}
                </p>
              </div>
              {recentDataItems.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{locale === "zh" ? "最近编辑的资料" : "Recent data"}</p>
                  <div className="grid gap-2">
                    {recentDataItems.slice(0, 4).map((item) => {
                      const key = buildStudioDataItemKey(item.key, item.locale)
                      const isSelected = key === selectedDataKey

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => void openDataItem(item)}
                          className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                            isSelected ? "border-primary/45 bg-primary/5" : "border-border/70 bg-card/45 hover:border-primary/35"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-foreground">{getDataLabel(item.key, locale)}</span>
                            <span className="text-xs text-muted-foreground">{item.locale}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.title}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3">
                {filteredDataItems.map((item) => {
                  const key = `${item.key}/${item.locale}`
                  const isSelected = key === selectedDataKey

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void openDataItem(item)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                        isSelected ? "border-primary/50 bg-primary/5" : "border-border/70 bg-card/65 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{getDataLabel(item.key, locale)}</span>
                        <span className="text-xs text-muted-foreground">{item.locale}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{item.title}</p>
                      {item.summary ? <p className="mt-1 text-xs text-muted-foreground">{item.summary}</p> : null}
                    </button>
                  )
                })}
                {filteredDataItems.length === 0 ? (
                  <p className="rounded-2xl border border-border/70 bg-card/45 px-4 py-3 text-sm text-muted-foreground">
                    {locale === "zh" ? "当前筛选条件下没有资料条目。" : "No data entries match the current filters."}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="page-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl">{String(copy.dataEditor)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedDataKey ?? String(copy.dataEmptyHint)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{dataStatus}</p>
                    {selectedDataKey ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dataDirty
                          ? locale === "zh"
                            ? "有未保存修改"
                            : "Unsaved changes"
                          : lastDataSavedAt
                            ? locale === "zh"
                              ? `上次保存：${lastDataSavedAt}`
                              : `Last saved: ${lastDataSavedAt}`
                            : locale === "zh"
                              ? "尚未保存"
                              : "Not saved yet"}
                      </p>
                    ) : null}
                  </div>
                  <Button variant="outline" onClick={() => setDataCollapsed((current) => !current)} disabled={!selectedDataKey}>
                    {dataCollapsed ? String(copy.expandAll) : String(copy.collapseAll)}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void copyText(dataJsonDirty ? dataJson : serializedDataValue, String(copy.copied), "dataStatus")}
                    disabled={!selectedDataKey}
                  >
                    {String(copy.copyJson)}
                  </Button>
                  <Button onClick={() => void saveDataItem()} disabled={!selectedDataKey || dataSavePending || studioReadOnly}>
                    {dataSavePending ? String(copy.savePending) : String(copy.save)}
                  </Button>
                </div>
              </div>

              {selectedDataKey ? (
                <>
                  <div className={`mt-5 rounded-2xl border px-4 py-4 ${dataSummaryTone}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {dataDirty
                            ? locale === "zh"
                              ? "当前结构化资料有未保存修改"
                              : "Structured data has unsaved changes"
                            : locale === "zh"
                              ? "当前结构化资料状态正常"
                              : "Structured data is up to date"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dataDirty
                            ? locale === "zh"
                              ? "建议保存后再切换资料条目，避免改动丢失。"
                              : "Save before switching entries to avoid losing changes."
                            : locale === "zh"
                              ? "当前 JSON 和表单内容已经同步。"
                              : "The form state and JSON output are currently in sync."}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{selectedDataEntry ? getDataLabel(selectedDataEntry.key, locale) : ""}</p>
                        <p className="mt-1">{lastDataSavedAt ? `${locale === "zh" ? "最近保存" : "Saved at"} ${lastDataSavedAt}` : locale === "zh" ? "尚未保存" : "Not saved yet"}</p>
                      </div>
                    </div>
                  </div>
                  {selectedDataEntry?.key === "updates" ? renderUpdateBlocksEditor() : null}
                  {selectedDataEntry?.key === "gallery" ? renderGalleryEditor() : null}

                  {!dataCollapsed ? (
                    <div className="mt-6">
                      {Array.isArray(dataValue) ? (
                        renderDataNode("", getDataLabel(selectedDataKey.split("/")[0] as StudioDataKey, locale), dataValue)
                      ) : (
                        renderObjectFields("", dataValue as Record<string, StudioDataNode>)
                      )}
                    </div>
                  ) : null}

                  <div className="mt-6">
                    <h3 className="text-base">{String(copy.generatedJson)}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{String(copy.rawJsonHint)}</p>
                    <Textarea
                      value={dataJsonDirty ? dataJson : serializedDataValue}
                      onChange={(event) => {
                        if (studioReadOnly) return
                        setDataJson(event.target.value)
                        setDataJsonDirty(true)
                      }}
                      placeholder={String(copy.rawJsonPlaceholder)}
                      className="mt-5 min-h-[320px] font-mono text-xs"
                      readOnly={studioReadOnly}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">{String(copy.dataEmptyHint)}</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
