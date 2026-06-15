import type { ComponentType } from "react"

import type { ActionLink, Locale } from "@/lib/i18n/messages"
import {
  generatedBlogModules,
  generatedNoteModules,
  generatedNoteRelations,
  generatedProjectModules,
} from "@/lib/content/generated-content-index"

export type { Locale }

export type BlogMeta = {
  title: string
  slug: string
  category: string
  date: string
  readingTime: string
  excerpt: string
  cover?: string
  tags: string[]
  draft?: boolean
  locale: Locale
}

export type NoteMeta = {
  title: string
  slug: string
  series: string
  date: string
  summary: string
  tags: string[]
  draft?: boolean
  locale: Locale
}

export type NoteRelationMap = Record<
  string,
  {
    outgoing: string[]
    backlinks: string[]
  }
>

export type ProjectMeta = {
  title: string
  slug: string
  period: string
  category: string
  status: string
  role: string
  summary: string
  outcome: string
  tags: string[]
  links: ActionLink[]
  conclusion: string
  background: string[]
  goal: string[]
  methods: string[]
  challenges: string[]
  results: string[]
  contributions: string[]
  nextSteps: string[]
  relatedSlugs: string[]
  draft?: boolean
  locale: Locale
}

export type BlogEntry = BlogMeta & {
  content: ComponentType
}

export type NoteEntry = NoteMeta & {
  content: ComponentType
}

export type ProjectEntry = ProjectMeta & {
  content: ComponentType
}

export type ContentModule<TMeta> = {
  meta: TMeta
  content: ComponentType
}

function sortByDateDesc<T extends { date: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function normalizeEntries<TMeta extends { draft?: boolean }>(
  modules: ContentModule<TMeta>[],
): Array<TMeta & { content: ComponentType }> {
  return modules
    .filter((module) => !module.meta.draft)
    .map((module) => ({
      ...module.meta,
      content: module.content,
    }))
}

function normalizeBlogEntries(locale: Locale): BlogEntry[] {
  return sortByDateDesc(normalizeEntries(generatedBlogModules[locale]))
}

function normalizeNoteEntries(locale: Locale): NoteEntry[] {
  return sortByDateDesc(normalizeEntries(generatedNoteModules[locale]))
}

function normalizeProjectEntries(locale: Locale): ProjectEntry[] {
  return normalizeEntries(generatedProjectModules[locale])
}

function collectTags<TEntry extends { tags: string[] }>(entries: TEntry[]) {
  return Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort((left, right) => left.localeCompare(right))
}

export function getAllBlogEntries(locale: Locale) {
  return normalizeBlogEntries(locale)
}

export function getAllNoteEntries(locale: Locale) {
  return normalizeNoteEntries(locale)
}

export function getAllProjectEntries(locale: Locale) {
  return normalizeProjectEntries(locale)
}

export function getAllBlogTags(locale: Locale) {
  return collectTags(normalizeBlogEntries(locale))
}

export function getAllNoteTags(locale: Locale) {
  return collectTags(normalizeNoteEntries(locale))
}

export function getBlogEntriesByTag(locale: Locale, tag?: string) {
  const entries = normalizeBlogEntries(locale)
  return tag ? entries.filter((entry) => entry.tags.includes(tag)) : entries
}

export function getNoteEntriesByTag(locale: Locale, tag?: string) {
  const entries = normalizeNoteEntries(locale)
  return tag ? entries.filter((entry) => entry.tags.includes(tag)) : entries
}

export function getBlogEntryBySlug(locale: Locale, slug: string) {
  return normalizeBlogEntries(locale).find((entry) => entry.slug === slug)
}

export function getNoteEntryBySlug(locale: Locale, slug: string) {
  return normalizeNoteEntries(locale).find((entry) => entry.slug === slug)
}

export function getProjectEntryBySlug(locale: Locale, slug: string) {
  return normalizeProjectEntries(locale).find((entry) => entry.slug === slug)
}

export function getRelatedBlogEntries(locale: Locale, currentSlug: string, tags: string[], limit = 2) {
  return normalizeBlogEntries(locale)
    .filter((entry) => entry.slug !== currentSlug)
    .map((entry) => ({
      entry,
      score: entry.tags.filter((tag) => tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime())
    .slice(0, limit)
    .map(({ entry }) => entry)
}

export function getRelatedNoteEntries(locale: Locale, currentSlug: string, tags: string[], limit = 2) {
  return normalizeNoteEntries(locale)
    .filter((entry) => entry.slug !== currentSlug)
    .map((entry) => ({
      entry,
      score: entry.tags.filter((tag) => tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime())
    .slice(0, limit)
    .map(({ entry }) => entry)
}

export function getNoteRelationEntries(locale: Locale, currentSlug: string) {
  const relation = generatedNoteRelations[locale]?.[currentSlug] ?? {
    outgoing: [],
    backlinks: [],
  }
  const notes = normalizeNoteEntries(locale)
  const noteBySlug = new Map(notes.map((note) => [note.slug, note]))
  const resolve = (slugs: string[]) => slugs.map((slug) => noteBySlug.get(slug)).filter((note): note is NoteEntry => Boolean(note))

  return {
    outgoing: resolve(relation.outgoing),
    backlinks: resolve(relation.backlinks),
  }
}

export function getRelatedProjectEntries(locale: Locale, currentSlug: string, tags: string[], limit = 2) {
  return normalizeProjectEntries(locale)
    .filter((entry) => entry.slug !== currentSlug)
    .map((entry) => ({
      entry,
      score: entry.tags.filter((tag) => tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry)
}
