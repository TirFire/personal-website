"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BookOpenText, GitBranch, NotebookPen, Tags, Workflow } from "lucide-react"

import { NoteCard } from "@/components/site/content-cards"
import { PageIntro } from "@/components/site/page-intro"
import { useLocale } from "@/components/providers/locale-provider"
import { Reveal } from "@/components/site/reveal"
import { getPageCopy, getUiCopy } from "@/lib/content/data"
import { getAllNoteEntries, getAllNoteTags } from "@/lib/content/mdx-content"

function anchorId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, "")
}

export function LearningPageContent() {
  const { locale } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageCopy = getPageCopy(locale)
  const uiCopy = getUiCopy(locale)
  const notes = getAllNoteEntries(locale)
  const tags = getAllNoteTags(locale)
  const activeTag = searchParams.get("tag")
  const copy = {
    all: locale === "zh" ? "全部" : "All",
    tagFilter: locale === "zh" ? "标签筛选" : "Tag filter",
    series: locale === "zh" ? "系列" : "Series",
    items: locale === "zh" ? "篇" : "items",
    knowledge: locale === "zh" ? "知识库入口" : "Knowledge base",
    visibleNotes: locale === "zh" ? "当前可见笔记" : "Visible notes",
    coveredSeries: locale === "zh" ? "覆盖系列" : "Series covered",
    tagsInUse: locale === "zh" ? "使用标签" : "Tags in use",
    seriesIndex: locale === "zh" ? "系列导航" : "Series index",
    tagIndex: locale === "zh" ? "标签索引" : "Tag index",
    crossBrowse: locale === "zh" ? "跨笔记浏览" : "Cross-note browsing",
    recentTimeline: locale === "zh" ? "最近更新" : "Recent timeline",
    noNotes:
      locale === "zh"
        ? "这个标签下还没有公开笔记，可以先切回“全部”查看完整知识库。"
        : "No public notes under this tag yet. Switch back to All to browse the full knowledge base.",
    relatedHint:
      locale === "zh"
        ? "点击标签会收敛到同一主题下的笔记；进入详情页后，还会继续按共享标签给出相关推荐。"
        : "Click a tag to narrow notes by topic. Detail pages continue the path with related notes by shared tags.",
    activePath: locale === "zh" ? "当前路径" : "Current path",
    openNote: locale === "zh" ? "打开笔记" : "Open note",
  }
  const filteredNotes = useMemo(
    () => (activeTag ? notes.filter((note) => note.tags.includes(activeTag)) : notes),
    [activeTag, notes],
  )
  const seriesGroups = useMemo(() => {
    const groups = new Map<string, typeof filteredNotes>()
    for (const note of filteredNotes) {
      const current = groups.get(note.series) ?? []
      current.push(note)
      groups.set(note.series, current)
    }
    return Array.from(groups.entries()).sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]))
  }, [filteredNotes])
  const tagGroups = useMemo(
    () =>
      tags.map((tag) => ({
        tag,
        notes: notes.filter((note) => note.tags.includes(tag)),
      })),
    [notes, tags],
  )
  const recentTimeline = filteredNotes.slice(0, 5)
  const activeTagNotes = activeTag ? notes.filter((note) => note.tags.includes(activeTag)).slice(0, 5) : recentTimeline
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
        eyebrow={pageCopy.learning.title}
        title={pageCopy.learning.title}
        description={pageCopy.learning.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <NotebookPen className="h-4 w-4 text-[color:var(--primary)]" />
              <span>
                {notes.length} {pageCopy.learning.countLabel}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{pageCopy.learning.introNote}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal className="page-panel mb-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Workflow className="h-4 w-4 text-[color:var(--primary)]" />
          <span>{pageCopy.learning.panelHint}</span>
        </Reveal>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.95fr)]">
          <div>
            <Reveal delay={80} className="page-panel mb-8 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.tagFilter}</span>
                <button
                  type="button"
                  onClick={() => setTag(null)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    activeTag === null
                      ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_18px_36px_-24px_rgba(31,91,71,0.72)]"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {copy.all}
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
            </Reveal>
            <div className="space-y-8">
              {seriesGroups.map(([series, seriesNotes], groupIndex) => (
                <Reveal key={series} id={`series-${anchorId(series)}`} delay={groupIndex * 80} className="scroll-mt-28 page-panel p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.series}</p>
                      <h2 className="mt-2 text-2xl">{series}</h2>
                    </div>
                    <span className="page-chip">
                      {seriesNotes.length} {copy.items}
                    </span>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {seriesNotes.map((note, index) => (
                      <Reveal key={note.slug} delay={index * 90}>
                        <NoteCard note={note} detailHref={`/learning/${note.slug}`} detailLabel={uiCopy.labels.openNote} />
                      </Reveal>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
            {seriesGroups.length === 0 ? (
              <Reveal delay={120} className="page-panel p-6 text-sm leading-7 text-muted-foreground">
                {copy.noNotes}
              </Reveal>
            ) : null}
          </div>
          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <Reveal delay={120} className="page-panel p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.knowledge}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">{copy.visibleNotes}</p>
                  <p className="mt-2 text-3xl">{filteredNotes.length}</p>
                </div>
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">{copy.coveredSeries}</p>
                  <p className="mt-2 text-3xl">{seriesGroups.length}</p>
                </div>
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">{copy.tagsInUse}</p>
                  <p className="mt-2 text-3xl">{tags.length}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={160} className="page-panel p-6">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[color:var(--primary)]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.seriesIndex}</p>
              </div>
              <div className="mt-5 space-y-2">
                {seriesGroups.map(([series, seriesNotes]) => (
                  <Link
                    key={series}
                    href={`#series-${anchorId(series)}`}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/45 px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <span>{series}</span>
                    <span className="text-muted-foreground">{seriesNotes.length}</span>
                  </Link>
                ))}
              </div>
            </Reveal>
            <Reveal delay={200} className="page-panel p-6">
              <div className="flex items-center gap-2">
                <Tags className="h-4 w-4 text-[color:var(--primary)]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.tagIndex}</p>
              </div>
              <div className="mt-5 space-y-4">
                {tagGroups.slice(0, 10).map(({ tag, notes: tagNotes }) => (
                  <div key={tag} className="rounded-[1.2rem] border border-border/70 bg-background/45 p-4">
                    <button type="button" onClick={() => setTag(tag)} className="text-left text-sm font-medium text-foreground hover:text-primary">
                      #{tag} <span className="text-muted-foreground">({tagNotes.length})</span>
                    </button>
                    <div className="mt-3 space-y-2">
                      {tagNotes.slice(0, 3).map((note) => (
                        <Link key={note.slug} href={`/learning/${note.slug}`} className="block text-sm leading-6 text-muted-foreground hover:text-primary">
                          {note.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={240} className="page-panel p-6">
              <div className="flex items-center gap-2">
                <BookOpenText className="h-4 w-4 text-[color:var(--primary)]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.crossBrowse}</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{copy.relatedHint}</p>
              <div className="mt-5 rounded-[1.2rem] bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.activePath}</p>
                <p className="mt-2 text-lg">{activeTag ? `#${activeTag}` : copy.all}</p>
              </div>
              <div className="mt-4 space-y-3">
                {activeTagNotes.map((note) => (
                  <Link key={note.slug} href={`/learning/${note.slug}`} className="block rounded-2xl border border-border/70 bg-background/45 p-4 hover:border-primary/40">
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{note.series}</p>
                  </Link>
                ))}
              </div>
            </Reveal>
            <Reveal delay={280} className="page-panel p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{copy.recentTimeline}</p>
              <div className="mt-5 space-y-4">
                {recentTimeline.map((note) => (
                  <Link key={note.slug} href={`/learning/${note.slug}`} className="block rounded-[1.2rem] border border-border/70 bg-background/50 p-4 hover:border-primary/40">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{note.date}</p>
                    <h3 className="mt-2 text-base">{note.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{note.series}</p>
                  </Link>
                ))}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </main>
  )
}
