"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { getPageCopy, getUiCopy } from "@/lib/content/data"
import { getNoteEntryBySlug, getNoteRelationEntries, getRelatedNoteEntries } from "@/lib/content/mdx-content"

export function NoteDetailPageContent({ slug }: { slug: string }) {
  const { locale } = useLocale()
  const pageCopy = getPageCopy(locale)
  const uiCopy = getUiCopy(locale)
  const entry = getNoteEntryBySlug(locale, slug)
  const related = entry ? getRelatedNoteEntries(locale, entry.slug, entry.tags) : []
  const relations = entry ? getNoteRelationEntries(locale, entry.slug) : { outgoing: [], backlinks: [] }
  const relationCopy = {
    outgoingTitle: locale === "zh" ? "本文链接到" : "Linked from this note",
    backlinksTitle: locale === "zh" ? "引用本文的笔记" : "Backlinks",
    relationHint:
      locale === "zh"
        ? "这些关系来自 Obsidian 双链或指向学习页的站内链接，用来帮助你在知识库里顺着上下文继续浏览。"
        : "These relations are extracted from Obsidian-style wiki links or internal learning links.",
  }

  if (!entry) {
    return (
      <main>
        <PageIntro eyebrow={pageCopy.learning.title} title={pageCopy.learning.notFoundTitle} description={pageCopy.learning.notFoundDescription} />
      </main>
    )
  }

  const Content = entry.content

  return (
    <main>
      <PageIntro
        eyebrow={entry.series}
        title={entry.title}
        description={entry.summary}
        aside={
          <div className="page-intro-panel">
            <Link href="/learning" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {uiCopy.labels.backToLearning}
            </Link>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="page-chip">{entry.date}</span>
              {entry.tags.map((tag) => (
                <Link key={tag} href={`/learning?tag=${encodeURIComponent(tag)}`} className="page-chip hover:text-foreground">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <Reveal alwaysVisible className="page-panel p-7 mdx-prose-shell">
          <Content />
        </Reveal>

        {relations.outgoing.length > 0 || relations.backlinks.length > 0 ? (
          <Reveal delay={120} className="mt-10 page-panel p-7">
            <SectionHeading title={locale === "zh" ? "笔记关系" : "Note graph"} />
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{relationCopy.relationHint}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                <h3 className="text-base font-medium">{relationCopy.outgoingTitle}</h3>
                <div className="mt-4 space-y-3">
                  {relations.outgoing.length > 0 ? (
                    relations.outgoing.map((note) => (
                      <Link key={note.slug} href={`/learning/${note.slug}`} className="block rounded-2xl bg-secondary/55 p-4 text-sm hover:text-primary">
                        <span className="font-medium text-foreground">{note.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{note.series}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-muted-foreground">{locale === "zh" ? "暂无显式外链。" : "No outgoing links yet."}</p>
                  )}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                <h3 className="text-base font-medium">{relationCopy.backlinksTitle}</h3>
                <div className="mt-4 space-y-3">
                  {relations.backlinks.length > 0 ? (
                    relations.backlinks.map((note) => (
                      <Link key={note.slug} href={`/learning/${note.slug}`} className="block rounded-2xl bg-secondary/55 p-4 text-sm hover:text-primary">
                        <span className="font-medium text-foreground">{note.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{note.series}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-muted-foreground">{locale === "zh" ? "暂无反向链接。" : "No backlinks yet."}</p>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ) : null}

        {related.length > 0 ? (
          <div className="mt-14">
            <SectionHeading title={uiCopy.labels.relatedNotes} />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {related.map((note) => (
                <Reveal key={note.slug} className="page-panel p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{note.series}</p>
                  <h3 className="mt-3 text-xl">{note.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{note.summary}</p>
                  <Link href={`/learning/${note.slug}`} className="mt-5 inline-flex text-sm font-medium text-primary underline decoration-border underline-offset-4">
                    {uiCopy.labels.openNote}
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
