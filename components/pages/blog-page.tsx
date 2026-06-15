"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BookOpenText, PenSquare } from "lucide-react"

import { ArticleCard } from "@/components/site/content-cards"
import { PageIntro } from "@/components/site/page-intro"
import { useLocale } from "@/components/providers/locale-provider"
import { Reveal } from "@/components/site/reveal"
import { getPageCopy, getUiCopy } from "@/lib/content/data"
import { getAllBlogEntries, getAllBlogTags } from "@/lib/content/mdx-content"

export function BlogPageContent() {
  const { locale } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageCopy = getPageCopy(locale)
  const uiCopy = getUiCopy(locale)
  const articles = getAllBlogEntries(locale)
  const tags = getAllBlogTags(locale)
  const activeTag = searchParams.get("tag")
  const filteredArticles = useMemo(
    () => (activeTag ? articles.filter((article) => article.tags.includes(activeTag)) : articles),
    [activeTag, articles],
  )
  const allLabel = locale === "zh" ? "全部" : "All"
  const filterHint =
    locale === "zh"
      ? "按标签切换阅读入口，保留更接近专题索引的浏览方式。"
      : "Filter by topic to move between essays, retrospectives, and technical notes more like an index."
  const setTag = (tag: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tag) {
      params.set("tag", tag)
    } else {
      params.delete("tag")
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <main>
      <PageIntro
        eyebrow={pageCopy.blog.title}
        title={pageCopy.blog.title}
        description={pageCopy.blog.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <BookOpenText className="h-4 w-4 text-[color:var(--primary)]" />
              <span>
                {articles.length} {pageCopy.blog.countLabel}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{pageCopy.blog.introNote}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal className="page-panel mb-8 flex items-center gap-3 text-sm text-muted-foreground">
          <PenSquare className="h-4 w-4 text-[color:var(--primary)]" />
          <span>{pageCopy.blog.panelHint}</span>
        </Reveal>
        <Reveal delay={80} className="page-panel mb-8 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {locale === "zh" ? "标签筛选" : "Tag filter"}
            </span>
            <button
              type="button"
              onClick={() => setTag(null)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                activeTag === null
                  ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_18px_36px_-24px_rgba(31,91,71,0.72)]"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {allLabel}
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTag(tag)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  activeTag === tag
                    ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_18px_36px_-24px_rgba(31,91,71,0.72)]"
                    : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{filterHint}</p>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredArticles.map((article, index) => (
            <Reveal key={article.slug} delay={index * 120}>
              <ArticleCard article={article} detailHref={`/blog/${article.slug}`} detailLabel={uiCopy.labels.readArticle} />
            </Reveal>
          ))}
        </div>
        {filteredArticles.length === 0 ? (
          <Reveal delay={120} className="page-panel mt-6 p-6 text-sm leading-7 text-muted-foreground">
            {locale === "zh" ? "这个标签下还没有文章，可以先切回“全部”继续浏览。" : "No posts yet under this tag. Switch back to All to keep browsing."}
          </Reveal>
        ) : null}
      </section>
    </main>
  )
}
