import Link from "next/link"
import Image from "next/image"

import type { BlogEntry, NoteEntry, ProjectEntry } from "@/lib/content/mdx-content"
import { getUpdatesData } from "@/lib/content/data"

type UpdateItem = ReturnType<typeof getUpdatesData>["items"][number]

type ProjectCardProps = {
  project: ProjectEntry
  labels: {
    role: string
    status: string
    links: string
  }
  detailHref?: string
  detailLabel?: string
}

export function ProjectCard({ project, labels, detailHref, detailLabel }: ProjectCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-border/75 bg-[linear-gradient(180deg,rgba(252,248,241,0.96),rgba(247,242,232,0.92))] p-6 shadow-[0_24px_60px_-36px_rgba(22,42,32,0.5)] transition-transform duration-300 hover:-translate-y-1">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,148,121,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(201,107,59,0.1),transparent_24%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-3 py-1 font-mono uppercase tracking-[0.16em]">{project.category}</span>
        <span>{project.period}</span>
      </div>
      <div className="relative mt-5 space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl leading-tight">{project.title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-2xl bg-secondary/70 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{labels.status}</p>
            <p className="mt-2 leading-7">{project.status}</p>
          </div>
          {project.role ? (
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{labels.role}</p>
              <p className="mt-2 leading-7">{project.role}</p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {detailHref && detailLabel ? (
            <Link href={detailHref} className="text-sm font-medium text-primary underline decoration-border underline-offset-4">
              {detailLabel}
            </Link>
          ) : null}
          {project.links?.length ? (
            <>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{labels.links}</span>
              {project.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function ArticleCard({ article, detailHref, detailLabel }: { article: BlogEntry; detailHref?: string; detailLabel?: string }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-border/75 bg-[linear-gradient(180deg,rgba(252,248,241,0.96),rgba(246,241,232,0.92))] p-6 shadow-[0_20px_50px_-40px_rgba(22,42,32,0.45)] transition-transform duration-300 hover:-translate-y-1">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,148,121,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(201,107,59,0.08),transparent_24%)] opacity-90" />
      {article.cover ? (
        <div className="relative mb-5 overflow-hidden rounded-[1.2rem] border border-border/70 bg-secondary/40">
          <Image
            src={article.cover}
            alt={article.title}
            width={1200}
            height={720}
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}
      <div className="relative flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-3 py-1 font-mono uppercase tracking-[0.16em]">{article.category}</span>
        <span>{article.date}</span>
        <span>{article.readingTime}</span>
      </div>
      <div className="relative mt-5 space-y-3">
        <h3 className="text-xl leading-tight">{article.title}</h3>
        <p className="text-sm leading-7 text-muted-foreground">{article.excerpt}</p>
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        {detailHref && detailLabel ? (
          <Link href={detailHref} className="inline-flex pt-2 text-sm font-medium text-primary underline decoration-border underline-offset-4">
            {detailLabel}
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function NoteCard({ note, detailHref, detailLabel }: { note: NoteEntry; detailHref?: string; detailLabel?: string }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-border/75 bg-[linear-gradient(180deg,rgba(252,248,241,0.96),rgba(246,241,232,0.92))] p-6 shadow-[0_20px_50px_-40px_rgba(22,42,32,0.45)] transition-transform duration-300 hover:-translate-y-1">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,148,121,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(201,107,59,0.08),transparent_24%)] opacity-90" />
      <div className="relative flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-3 py-1 font-mono uppercase tracking-[0.16em]">{note.series}</span>
        <span>{note.date}</span>
      </div>
      <div className="relative mt-5 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl leading-tight">{note.title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{note.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        {detailHref && detailLabel ? (
          <Link href={detailHref} className="inline-flex pt-1 text-sm font-medium text-primary underline decoration-border underline-offset-4">
            {detailLabel}
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function UpdateCard({ update }: { update: UpdateItem }) {
  return (
    <article className="relative overflow-hidden rounded-[1.5rem] border border-border/75 bg-[linear-gradient(180deg,rgba(252,248,241,0.96),rgba(246,241,232,0.92))] p-5 shadow-[0_20px_44px_-40px_rgba(22,42,32,0.48)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,148,121,0.11),transparent_32%)] opacity-90" />
      {update.image ? (
        <div className="relative mb-5 overflow-hidden rounded-[1.2rem] border border-border/70 bg-secondary/40">
          <Image src={update.image} alt={update.title} width={1200} height={720} className="aspect-[16/9] w-full object-cover" />
        </div>
      ) : null}
      <p className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{update.date}</p>
      <h3 className="relative mt-4 text-lg leading-tight">{update.title}</h3>
      <p className="relative mt-2 text-sm leading-7 text-muted-foreground">{update.summary}</p>
      <div className="relative mt-4 flex flex-wrap gap-2">
        {update.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </article>
  )
}
