"use client"

import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"
import { ArrowUpRight, BookText, BrainCircuit, Radar } from "lucide-react"

import { ArticleCard, NoteCard, ProjectCard, UpdateCard } from "@/components/site/content-cards"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { GradientBar } from "@/components/ui/gradient-bar"
import { getPageCopy, getProfile, getResearchAreas, getSiteConfig, getUiCopy, getUpdatesData } from "@/lib/content/data"
import { getAllBlogEntries, getAllNoteEntries, getAllProjectEntries } from "@/lib/content/mdx-content"

export function HomePageContent() {
  const { locale } = useLocale()
  const pageCopy = getPageCopy(locale)
  const uiCopy = getUiCopy(locale)
  const profile = getProfile(locale)
  const siteConfig = getSiteConfig(locale)
  const researchAreas = getResearchAreas(locale)
  const updates = getUpdatesData(locale)
  const featuredProjects = getAllProjectEntries(locale).slice(0, 2)
  const latestPosts = getAllBlogEntries(locale).slice(0, 2)
  const latestNotes = getAllNoteEntries(locale).slice(0, 3)
  const titleSegments =
    locale === "zh"
      ? Array.from(pageCopy.home.hero.title).filter((char) => char.trim().length > 0)
      : pageCopy.home.hero.title.split(" ")

  return (
    <main className="relative">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="hero-aurora absolute inset-0 -z-20" />
        <div className="hero-noise absolute inset-0 -z-10 opacity-60" />
        <div className="absolute left-[-10rem] top-20 -z-10 h-72 w-72 rounded-full bg-[rgba(112,160,132,0.16)] blur-3xl" />
        <div className="absolute right-[-8rem] top-32 -z-10 h-80 w-80 rounded-full bg-[rgba(204,148,110,0.16)] blur-3xl" />
        <div className="absolute right-[-7rem] top-10 -z-10 hidden lg:block">
          <div className="hero-orb-wrap">
            <Image src="/images/orb.png" alt="" width={780} height={780} className="hero-orb-image animate-orb-rotate" priority />
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-24 sm:px-6 md:px-10 md:pb-24 md:pt-36 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <div className="max-w-4xl space-y-7">
            <Reveal className="space-y-5">
              <h1 className="max-w-3xl text-[1.92rem] font-semibold leading-[1.16] tracking-[-0.02em] sm:text-[2.42rem] md:text-[3.85rem] md:leading-[1.08] md:tracking-[-0.03em] lg:text-[4.18rem]">
                {titleSegments.map((segment, index) => (
                  <span
                    key={`${segment}-${index}`}
                    className="hero-word"
                    style={{
                      animationDelay: `${index * 90}ms`,
                      marginRight: locale === "en" && index < titleSegments.length - 1 ? "0.22em" : "0",
                    }}
                  >
                    {segment}
                  </span>
                ))}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-foreground/84 md:text-[1.12rem] md:leading-9">{pageCopy.home.hero.description}</p>
            </Reveal>
            <Reveal delay={150} className="grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Link href={pageCopy.home.hero.primaryCta.href} className="hero-primary-button">
                {pageCopy.home.hero.primaryCta.label}
              </Link>
              <Link href={pageCopy.home.hero.secondaryCta.href} className="hero-secondary-button">
                {pageCopy.home.hero.secondaryCta.label}
              </Link>
            </Reveal>
          </div>

          <Reveal delay={180} className="relative lg:pt-6">
            <div className="hero-surface-panel">
              <div className="grid gap-5">
                <div className="hero-floating-card animate-soft-float">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{pageCopy.home.hero.profileLabel}</p>
                      <h3 className="mt-3 text-2xl leading-tight">{profile.affiliation}</h3>
                    </div>
                    <BrainCircuit className="h-5 w-5 text-[color:var(--primary)]" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{profile.role}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="hero-floating-card animate-soft-float [animation-delay:180ms]">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{pageCopy.home.hero.researchLabel}</p>
                      <Radar className="h-4 w-4 text-[color:var(--primary)]" />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {researchAreas[0]?.title} / {researchAreas[1]?.title}
                    </p>
                  </div>

                  <div className="hero-floating-card animate-soft-float [animation-delay:320ms]">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{pageCopy.home.hero.writingLabel}</p>
                      <BookText className="h-4 w-4 text-[color:var(--primary)]" />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {pageCopy.home.latestBlogTitle} / {pageCopy.home.latestNotesTitle}
                    </p>
                  </div>
                </div>

                <div className="hero-floating-card animate-soft-float [animation-delay:460ms]">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{pageCopy.home.hero.quickAccessLabel}</p>
                    <ArrowUpRight className="h-4 w-4 text-[color:var(--primary)]" />
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Link href="/projects" className="hero-mini-link">
                      {pageCopy.home.featuredProjectsTitle}
                    </Link>
                    <Link href="/blog" className="hero-mini-link">
                      {pageCopy.home.latestBlogTitle}
                    </Link>
                    <Link href="/learning" className="hero-mini-link">
                      {pageCopy.home.latestNotesTitle}
                    </Link>
                    <Link href="/about" className="hero-mini-link">
                      {pageCopy.about.title}
                    </Link>
                  </div>
                </div>

                <div className="hero-floating-card animate-soft-float border-primary/20 bg-[linear-gradient(135deg,rgba(255,253,247,0.95),rgba(230,240,222,0.82))] [animation-delay:620ms]">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{pageCopy.home.hero.dailyQuoteLabel}</p>
                  <p className="mt-4 text-lg leading-8 text-foreground/88">{pageCopy.home.hero.dailyQuoteText}</p>
                  <p className="mt-5 text-xs text-muted-foreground">{pageCopy.home.hero.dailyQuoteFootnote}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-18 md:px-10 md:py-28">
        <SectionHeading title={pageCopy.home.research.title} description={pageCopy.home.research.description} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {researchAreas.map((area, index) => (
            <Reveal
              key={area.title}
              delay={index * 110}
              className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,rgba(252,248,241,0.96),rgba(246,241,232,0.9))] p-6 shadow-[0_20px_54px_-42px_rgba(22,42,32,0.45)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,148,121,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(201,107,59,0.08),transparent_24%)]" />
              <div className="relative">
                <h3 className="text-2xl leading-tight">{area.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{area.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {area.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {featuredProjects.length > 0 ? (
        <section id="home-projects" className="border-y border-border/70 bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-18 md:px-10 md:py-28">
            <SectionHeading
              title={pageCopy.home.featuredProjectsTitle}
              action={
                <Link href="/projects" className="text-sm font-medium text-primary underline decoration-border underline-offset-4">
                  {siteConfig.navigation.primaryNav[1]?.label}
                </Link>
              }
            />
            <div className="mt-10 space-y-8">
              {featuredProjects.map((project, index) => (
                <Reveal
                  key={project.slug}
                  delay={index * 140}
                  className="md:sticky"
                  style={{ top: `${5.5 + index * 1.5}rem`, zIndex: index + 1 } as CSSProperties}
                >
                  <ProjectCard
                    project={project}
                    labels={pageCopy.projects.labels}
                    detailHref={`/projects/${project.slug}`}
                    detailLabel={uiCopy.labels.openProject}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-18 md:px-10 md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <div className="space-y-10">
          <SectionHeading
            title={pageCopy.home.latestBlogTitle}
            action={
              <Link href="/blog" className="text-sm font-medium text-primary underline decoration-border underline-offset-4">
                {siteConfig.navigation.primaryNav[2]?.label}
              </Link>
            }
          />
          <div className="grid gap-6">
            {latestPosts.map((article, index) => (
              <Reveal key={article.slug} delay={index * 120}>
                <ArticleCard article={article} detailHref={`/blog/${article.slug}`} detailLabel={uiCopy.labels.readArticle} />
              </Reveal>
            ))}
          </div>
        </div>
        <div className="space-y-10">
          <SectionHeading
            title={pageCopy.home.latestNotesTitle}
            action={
              <Link href="/learning" className="text-sm font-medium text-primary underline decoration-border underline-offset-4">
                {siteConfig.navigation.primaryNav[3]?.label}
              </Link>
            }
          />
          <div className="grid gap-6">
            {latestNotes.map((note, index) => (
              <Reveal key={note.slug} delay={index * 100}>
                <NoteCard note={note} detailHref={`/learning/${note.slug}`} detailLabel={uiCopy.labels.openNote} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-18 md:px-10 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-8">
              <SectionHeading
                title={pageCopy.home.updatesTitle}
                action={
              <Link href="/updates" className="text-sm font-medium text-primary underline decoration-border underline-offset-4">
                {siteConfig.navigation.secondaryNav[0]?.label ?? pageCopy.home.updatesTitle}
              </Link>
            }
          />
              <div className="grid gap-5">
                {updates.items.map((update, index) => (
                  <Reveal key={`${update.date}-${update.title}`} delay={index * 90}>
                    <UpdateCard update={update} />
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="space-y-8">
              <SectionHeading title={pageCopy.home.aboutTitle} />
              <Reveal className="rounded-[1.75rem] border border-border/80 bg-card p-7 shadow-[0_20px_54px_-42px_rgba(22,42,32,0.45)]">
                <p className="text-base leading-8 text-muted-foreground">{pageCopy.home.aboutSummary}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 md:px-10 md:py-18">
        <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-border/70 bg-card/65 px-5 py-4 text-sm text-muted-foreground">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {locale === "zh" ? "第二层入口" : "Secondary navigation"}
            </p>
            <p className="mt-2">
              {locale === "zh"
                ? "说说、相册与友链放在次级入口，保持主页主线清晰，同时保留持续更新和生活感。"
                : "Updates, gallery, and friends stay as secondary entrances so the professional spine remains clear while lighter records keep the site alive."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {siteConfig.navigation.secondaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="hero-mini-link">
                {item.label}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>
      <GradientBar targetId="home-projects" />
    </main>
  )
}
