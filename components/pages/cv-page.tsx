"use client"

import Link from "next/link"
import { FileUser } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { getCvData } from "@/lib/content/data"

export function CvPageContent() {
  const { locale } = useLocale()
  const cv = getCvData(locale)

  return (
    <main>
      <PageIntro
        eyebrow={cv.title}
        title={cv.title}
        description={cv.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <FileUser className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{cv.lastUpdated}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{cv.downloadNote}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal className="page-panel mb-8 p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {locale === "zh" ? "简历摘要" : "CV snapshot"}
              </p>
              {cv.highlights && cv.highlights.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {cv.highlights.map((item) => (
                    <span key={item} className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {cv.downloadHref ? (
              <Link
                href={cv.downloadHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {locale === "zh" ? "下载 PDF" : "Download PDF"}
              </Link>
            ) : (
              <div className="rounded-full border border-border/70 px-5 py-3 text-sm text-muted-foreground">
                {locale === "zh" ? "PDF 稍后补充" : "PDF coming later"}
              </div>
            )}
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cv.sections.map((section, index) => (
            <Reveal key={section.title} delay={index * 100} className="page-panel p-7">
              <SectionHeading title={section.title} />
              <ul className="mt-6 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="text-sm leading-7 text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  )
}
