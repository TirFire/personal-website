"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

import { getProjectEntryBySlug, getRelatedProjectEntries } from "@/lib/content/mdx-content"
import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { getPageCopy, getUiCopy } from "@/lib/content/data"

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Reveal className="page-panel p-7">
      <h2 className="section-title-animate text-2xl leading-tight md:text-3xl">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm leading-7 text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

export function ProjectDetailPageContent({ slug }: { slug: string }) {
  const { locale } = useLocale()
  const pageCopy = getPageCopy(locale)
  const uiCopy = getUiCopy(locale)
  const summary = getProjectEntryBySlug(locale, slug)

  if (!summary) {
    return (
      <main>
        <PageIntro
          eyebrow={pageCopy.projects.title}
          title={pageCopy.projects.notFoundTitle}
          description={pageCopy.projects.notFoundDescription}
        />
      </main>
    )
  }

  const relatedProjects = getRelatedProjectEntries(locale, summary.slug, summary.tags)
  const Content = summary.content

  return (
    <main>
      <PageIntro
        eyebrow={summary.category}
        title={summary.title}
        description={summary.summary}
        aside={
          <div className="page-intro-panel">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {uiCopy.labels.backToProjects}
            </Link>
            <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl bg-secondary/70 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]">{pageCopy.projects.labels.status}</p>
                <p className="mt-2 text-foreground">{summary.status}</p>
              </div>
              <div className="rounded-2xl bg-secondary/70 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]">{pageCopy.projects.labels.role}</p>
                <p className="mt-2 text-foreground">{summary.role}</p>
              </div>
              <div className="rounded-2xl bg-secondary/70 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em]">{pageCopy.projects.labels.outcome}</p>
                <p className="mt-2 text-foreground">{summary.outcome}</p>
              </div>
            </div>
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal className="page-panel p-7">
          <SectionHeading title={uiCopy.labels.projectConclusion} />
          <p className="mt-5 text-base leading-8 text-muted-foreground">{summary.conclusion}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {summary.tags.map((tag) => (
              <span key={tag} className="page-chip">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            {summary.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-border underline-offset-4"
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <BulletSection title={uiCopy.labels.projectBackground} items={summary.background} />
          <BulletSection title={uiCopy.labels.projectGoal} items={summary.goal} />
          <BulletSection title={uiCopy.labels.projectMethods} items={summary.methods} />
          <BulletSection title={uiCopy.labels.projectChallenges} items={summary.challenges} />
          <BulletSection title={uiCopy.labels.projectResults} items={summary.results} />
          <BulletSection title={uiCopy.labels.projectContributions} items={summary.contributions} />
        </div>

        <div className="mt-6">
          <BulletSection title={uiCopy.labels.projectNextSteps} items={summary.nextSteps} />
        </div>

        <Reveal alwaysVisible delay={140} className="mt-6 page-panel p-7">
          <SectionHeading title={pageCopy.projects.archiveNotesTitle} />
          <div className="mt-5 mdx-prose-shell">
            <Content />
          </div>
        </Reveal>

        {relatedProjects.length > 0 ? (
          <div className="mt-14">
            <SectionHeading title={uiCopy.labels.relatedProjects} />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {relatedProjects.map((project) => (
                <Reveal key={project.slug} className="page-panel p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{project.category}</p>
                  <h3 className="mt-3 text-xl">{project.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{project.summary}</p>
                  <Link href={`/projects/${project.slug}`} className="mt-5 inline-flex text-sm font-medium text-primary underline decoration-border underline-offset-4">
                    {uiCopy.labels.openProject}
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
