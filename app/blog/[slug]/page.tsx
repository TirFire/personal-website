import type { Metadata } from "next"
import { BlogDetailPageContent } from "@/components/pages/blog-detail-page"
import { getBlogEntryBySlug } from "@/lib/content/mdx-content"
import { defaultLocale } from "@/lib/i18n/messages"
import { buildBlogJsonLd, buildPageMetadata, jsonLdScript } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const entry = getBlogEntryBySlug(defaultLocale, slug)

  if (!entry) {
    return buildPageMetadata({
      title: "Blog",
      description: "Research writing, technical notes, and project retrospectives.",
      path: `/blog/${slug}`,
    })
  }

  return buildPageMetadata({
    title: entry.title,
    description: entry.excerpt,
    path: `/blog/${entry.slug}`,
    imagePath: entry.cover ?? `/blog/${entry.slug}/opengraph-image`,
    keywords: entry.tags,
    type: "article",
    publishedTime: entry.date,
  })
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getBlogEntryBySlug(defaultLocale, slug)

  return (
    <>
      {entry ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(buildBlogJsonLd(entry))} /> : null}
      <BlogDetailPageContent slug={slug} />
    </>
  )
}
