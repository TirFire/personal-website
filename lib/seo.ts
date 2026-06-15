import type { Metadata } from "next"

import { getSiteConfig } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import type { BlogEntry, NoteEntry, ProjectEntry } from "@/lib/content/mdx-content"

const FALLBACK_SITE_URL = "http://localhost:3000"

export function getSiteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }

  return FALLBACK_SITE_URL
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteOrigin()).toString()
}

type PageMetadataInput = {
  title?: string
  description: string
  path?: string
  imagePath?: string
  keywords?: string[]
  type?: "website" | "article"
  publishedTime?: string
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  imagePath = "/opengraph-image",
  keywords = [],
  type = "website",
  publishedTime,
}: PageMetadataInput): Metadata {
  const siteConfig = getSiteConfig(defaultLocale)
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(imagePath)
  const mergedKeywords = Array.from(new Set([...siteConfig.metadata.keywords, ...keywords]))

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: title ?? siteConfig.metadata.title,
      description,
      url,
      siteName: siteConfig.metadata.author,
      locale: defaultLocale === "zh" ? "zh_CN" : "en_US",
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.metadata.title,
      description,
      images: [imageUrl],
    },
  }
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  }
}

export function buildBlogJsonLd(entry: BlogEntry) {
  const siteConfig = getSiteConfig(defaultLocale)

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: entry.title,
    description: entry.excerpt,
    datePublished: entry.date,
    dateModified: entry.date,
    author: {
      "@type": "Person",
      name: siteConfig.metadata.author,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.metadata.author,
    },
    keywords: entry.tags.join(", "),
    mainEntityOfPage: absoluteUrl(`/blog/${entry.slug}`),
    url: absoluteUrl(`/blog/${entry.slug}`),
    ...(entry.cover ? { image: absoluteUrl(entry.cover) } : {}),
  }
}

export function buildNoteJsonLd(entry: NoteEntry) {
  const siteConfig = getSiteConfig(defaultLocale)

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: entry.title,
    description: entry.summary,
    datePublished: entry.date,
    dateModified: entry.date,
    author: {
      "@type": "Person",
      name: siteConfig.metadata.author,
    },
    keywords: entry.tags.join(", "),
    about: entry.series,
    mainEntityOfPage: absoluteUrl(`/learning/${entry.slug}`),
    url: absoluteUrl(`/learning/${entry.slug}`),
  }
}

export function buildProjectJsonLd(entry: ProjectEntry) {
  const siteConfig = getSiteConfig(defaultLocale)

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: entry.title,
    description: entry.summary,
    creator: {
      "@type": "Person",
      name: siteConfig.metadata.author,
    },
    keywords: entry.tags.join(", "),
    genre: entry.category,
    temporalCoverage: entry.period,
    mainEntityOfPage: absoluteUrl(`/projects/${entry.slug}`),
    url: absoluteUrl(`/projects/${entry.slug}`),
  }
}
