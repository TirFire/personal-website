"use client"

import { FolderKanban, Sparkles } from "lucide-react"

import { getAllProjectEntries } from "@/lib/content/mdx-content"
import { ProjectCard } from "@/components/site/content-cards"
import { PageIntro } from "@/components/site/page-intro"
import { useLocale } from "@/components/providers/locale-provider"
import { Reveal } from "@/components/site/reveal"
import { getPageCopy, getUiCopy } from "@/lib/content/data"

export function ProjectsPageContent() {
  const { locale } = useLocale()
  const pageCopy = getPageCopy(locale)
  const uiCopy = getUiCopy(locale)
  const projects = getAllProjectEntries(locale)
  const groupedProjects = Array.from(
    projects.reduce((map, project) => {
      const current = map.get(project.category) ?? []
      current.push(project)
      map.set(project.category, current)
      return map
    }, new Map<string, typeof projects>()),
  )

  return (
    <main>
      <PageIntro
        eyebrow={pageCopy.projects.title}
        title={pageCopy.projects.title}
        description={pageCopy.projects.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <FolderKanban className="h-4 w-4 text-[color:var(--primary)]" />
              <span>
                {projects.length} {pageCopy.projects.countLabel}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{pageCopy.projects.introNote}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal className="page-panel flex flex-wrap gap-3">
          {groupedProjects.map(([category, items]) => (
            <a key={category} href={`#${encodeURIComponent(category)}`} className="page-chip transition-colors hover:text-foreground">
              {category}
              <span className="ml-2 text-muted-foreground">
                {items.length} {pageCopy.projects.categoryCountLabel ?? pageCopy.projects.countLabel}
              </span>
            </a>
          ))}
          <div className="ml-auto hidden items-center gap-2 rounded-full bg-secondary/80 px-4 py-2 text-xs text-muted-foreground md:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{pageCopy.projects.panelHint}</span>
          </div>
        </Reveal>
        <div className="mt-12 space-y-14">
          {projects.length === 0 ? (
            <Reveal className="page-panel p-7">
              <h2 className="text-2xl leading-tight">{locale === "zh" ? "还没有项目条目" : "No project entries yet"}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {locale === "zh"
                  ? "现在项目已经改成更轻的 MDX 结构了。直接在 /studio 新建一个 projects 条目，或在 content/{locale}/projects 下添加一个 .mdx 文件即可。"
                  : "Projects now use a lighter MDX structure. Create one from /studio or add a .mdx file under content/{locale}/projects."}
              </p>
            </Reveal>
          ) : null}
          {groupedProjects.map(([category, items], groupIndex) => (
            <section key={category} id={encodeURIComponent(category)} className="scroll-mt-28">
              <Reveal delay={groupIndex * 80} className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    {pageCopy.projects.categoryOverviewTitle ?? (locale === "zh" ? "项目分类" : "Archive category")}
                  </p>
                  <h2 className="mt-2 text-2xl md:text-3xl">{category}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {items.length} {pageCopy.projects.categoryCountLabel ?? pageCopy.projects.countLabel}
                </p>
              </Reveal>
              <div className="grid gap-6">
                {items.map((project, index) => (
                  <Reveal key={project.slug} delay={index * 110}>
                    <ProjectCard
                      project={project}
                      labels={pageCopy.projects.labels}
                      detailHref={`/projects/${project.slug}`}
                      detailLabel={uiCopy.labels.openProject}
                    />
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
