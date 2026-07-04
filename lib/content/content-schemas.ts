import { z } from "zod"

const localeSchema = z.enum(["en", "zh"])

const actionLinkSchema = z.object({
  href: z.string().min(1),
  label: z.string().min(1),
  external: z.boolean().optional(),
})

export const blogMetaSchema = z.object({
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
})

export const noteMetaSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  series: z.string().min(1),
  date: z.string().min(1),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  draft: z.boolean().optional(),
  locale: localeSchema,
})

export const projectMetaSchema = z.object({
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
})

export type BlogMetaSchema = z.infer<typeof blogMetaSchema>
export type NoteMetaSchema = z.infer<typeof noteMetaSchema>
export type ProjectMetaSchema = z.infer<typeof projectMetaSchema>
