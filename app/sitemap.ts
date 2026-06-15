import type { MetadataRoute } from "next"

import { getGalleryData } from "@/lib/content/data"
import { getAllBlogEntries, getAllNoteEntries, getAllProjectEntries } from "@/lib/content/mdx-content"
import { defaultLocale } from "@/lib/i18n/messages"
import { absoluteUrl } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes = ["/", "/projects", "/blog", "/learning", "/about", "/updates", "/gallery", "/friends", "/output", "/now", "/analytics"]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }))

  const blogEntries: MetadataRoute.Sitemap = getAllBlogEntries(defaultLocale).map((entry) => ({
    url: absoluteUrl(`/blog/${entry.slug}`),
    lastModified: new Date(entry.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const noteEntries: MetadataRoute.Sitemap = getAllNoteEntries(defaultLocale).map((entry) => ({
    url: absoluteUrl(`/learning/${entry.slug}`),
    lastModified: new Date(entry.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const projectEntries: MetadataRoute.Sitemap = getAllProjectEntries(defaultLocale).map((entry) => ({
    url: absoluteUrl(`/projects/${entry.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const galleryEntries: MetadataRoute.Sitemap = getGalleryData(defaultLocale).groups.map((group) => ({
    url: absoluteUrl(`/gallery/${group.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  return [...staticEntries, ...blogEntries, ...noteEntries, ...projectEntries, ...galleryEntries]
}
