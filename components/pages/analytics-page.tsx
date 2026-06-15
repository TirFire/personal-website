"use client"

import Link from "next/link"
import { BarChart3, Eye, MousePointerClick, UsersRound } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { BusuanziStats } from "@/components/site/busuanzi-stats"
import { useLocale } from "@/components/providers/locale-provider"
import { getAllBlogEntries, getAllNoteEntries, getAllProjectEntries } from "@/lib/content/mdx-content"

export function AnalyticsPageContent() {
  const { locale } = useLocale()
  const blogEntries = getAllBlogEntries(locale).slice(0, 5)
  const noteEntries = getAllNoteEntries(locale).slice(0, 5)
  const projectEntries = getAllProjectEntries(locale).slice(0, 5)
  const copy = {
    eyebrow: locale === "zh" ? "访问统计" : "Analytics",
    title: locale === "zh" ? "站点访问概览" : "Site analytics overview",
    description:
      locale === "zh"
        ? "这里集中展示公开访问量，并说明更细的趋势数据应该去哪里查看。"
        : "A lightweight place to check public page counters and where to inspect detailed trends.",
    siteStats: locale === "zh" ? "全站公开计数" : "Public site counters",
    currentPage: locale === "zh" ? "当前页面计数" : "Current page counter",
    vercelTitle: locale === "zh" ? "趋势与来源" : "Trends and referrers",
    vercelDescription:
      locale === "zh"
        ? "Vercel Analytics 已在全站接入。部署到 Vercel 后，PV/访客趋势、来源、设备等详细数据需要在 Vercel 项目后台查看。"
        : "Vercel Analytics is wired globally. After deployment, detailed trends, referrers, and devices are available in the Vercel project dashboard.",
    hotProxy: locale === "zh" ? "重点页面快速入口" : "Important pages",
    hotProxyHint:
      locale === "zh"
        ? "Busuanzi 不提供站内热门排行 API；这里先提供近期内容入口。后续如果要热门页面榜，需要接自建统计或带 API 的分析服务。"
        : "Busuanzi does not expose a hot-page API. These are recent public content entries; a real ranking needs a custom tracker or analytics API.",
    blog: locale === "zh" ? "博客" : "Blog",
    notes: locale === "zh" ? "学习" : "Learning",
    projects: locale === "zh" ? "项目" : "Projects",
    openVercel: locale === "zh" ? "打开 Vercel Analytics" : "Open Vercel Analytics",
  }

  return (
    <main>
      <PageIntro
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <BarChart3 className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{copy.siteStats}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              <BusuanziStats />
            </p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal className="page-panel p-6">
            <Eye className="h-5 w-5 text-[color:var(--primary)]" />
            <h2 className="mt-4 text-xl">{copy.siteStats}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              <BusuanziStats />
            </p>
          </Reveal>
          <Reveal delay={80} className="page-panel p-6">
            <MousePointerClick className="h-5 w-5 text-[color:var(--primary)]" />
            <h2 className="mt-4 text-xl">{copy.currentPage}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              <BusuanziStats mode="page" />
            </p>
          </Reveal>
          <Reveal delay={160} className="page-panel p-6">
            <UsersRound className="h-5 w-5 text-[color:var(--primary)]" />
            <h2 className="mt-4 text-xl">{copy.vercelTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{copy.vercelDescription}</p>
            <Link
              href="https://vercel.com/analytics"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex text-sm font-medium text-primary underline decoration-border underline-offset-4"
            >
              {copy.openVercel}
            </Link>
          </Reveal>
        </div>

        <Reveal delay={220} className="mt-8 page-panel p-7">
          <h2 className="text-2xl">{copy.hotProxy}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{copy.hotProxyHint}</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              { title: copy.blog, items: blogEntries, prefix: "/blog" },
              { title: copy.notes, items: noteEntries, prefix: "/learning" },
              { title: copy.projects, items: projectEntries, prefix: "/projects" },
            ].map((group) => (
              <div key={group.title} className="rounded-[1.5rem] border border-border/70 bg-background/45 p-5">
                <h3 className="text-base font-medium">{group.title}</h3>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`${group.prefix}/${item.slug}`}
                      className="block rounded-2xl bg-secondary/55 p-4 text-sm hover:text-primary"
                    >
                      <span className="font-medium text-foreground">{item.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {"date" in item ? item.date : "period" in item ? item.period : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </main>
  )
}
