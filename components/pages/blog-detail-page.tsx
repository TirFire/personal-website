"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { GiscusComments } from "@/components/site/giscus-comments"
import { useLocale } from "@/components/providers/locale-provider"
import { getPageCopy, getSiteConfig, getUiCopy } from "@/lib/content/data"
import { getBlogEntryBySlug, getRelatedBlogEntries } from "@/lib/content/mdx-content"

export function BlogDetailPageContent({ slug }: { slug: string }) {
  const { locale } = useLocale()
  const pageCopy = getPageCopy(locale)
  const siteConfig = getSiteConfig(locale)
  const uiCopy = getUiCopy(locale)
  const entry = getBlogEntryBySlug(locale, slug)
  const related = entry ? getRelatedBlogEntries(locale, entry.slug, entry.tags) : []
  const commentsConfig = siteConfig.comments
  const commentsReady = Boolean(
    commentsConfig?.enabled &&
      commentsConfig.repo &&
      commentsConfig.repoId &&
      commentsConfig.category &&
      commentsConfig.categoryId,
  )

  if (!entry) {
    return (
      <main>
        <PageIntro eyebrow={pageCopy.blog.title} title={pageCopy.blog.notFoundTitle} description={pageCopy.blog.notFoundDescription} />
      </main>
    )
  }

  const Content = entry.content

  return (
    <main>
      <PageIntro
        eyebrow={entry.category}
        title={entry.title}
        description={entry.excerpt}
        aside={
          <div className="page-intro-panel">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {uiCopy.labels.backToBlog}
            </Link>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="page-chip">{entry.date}</span>
              <span className="page-chip">{entry.readingTime}</span>
              {entry.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="page-chip hover:text-foreground">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-24">
        {entry.cover ? (
          <Reveal alwaysVisible className="page-panel mb-8 overflow-hidden p-0">
            <Image src={entry.cover} alt={entry.title} width={1400} height={840} className="aspect-[16/9] w-full object-cover" />
          </Reveal>
        ) : null}
        <Reveal alwaysVisible className="page-panel p-7 mdx-prose-shell">
          <Content />
        </Reveal>

        <Reveal delay={160} className="mt-10 page-panel p-7">
          <SectionHeading title={uiCopy.labels.articleComments} />
          {commentsReady && commentsConfig ? (
            <div className="mt-5">
              <GiscusComments
                repo={commentsConfig.repo}
                repoId={commentsConfig.repoId}
                category={commentsConfig.category}
                categoryId={commentsConfig.categoryId}
                mapping={commentsConfig.mapping}
                strict={commentsConfig.strict}
                reactionsEnabled={commentsConfig.reactionsEnabled}
                emitMetadata={commentsConfig.emitMetadata}
                inputPosition={commentsConfig.inputPosition}
                lang={commentsConfig.lang}
                theme={commentsConfig.theme}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{uiCopy.labels.articleCommentsHint}</p>
          )}
        </Reveal>

        {related.length > 0 ? (
          <div className="mt-14">
            <SectionHeading title={uiCopy.labels.relatedArticles} />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {related.map((article) => (
                <Reveal key={article.slug} className="page-panel p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{article.category}</p>
                  <h3 className="mt-3 text-xl">{article.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{article.excerpt}</p>
                  <Link href={`/blog/${article.slug}`} className="mt-5 inline-flex text-sm font-medium text-primary underline decoration-border underline-offset-4">
                    {uiCopy.labels.readArticle}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
