"use client"

import Link from "next/link"
import { FileStack } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { getOutputData } from "@/lib/content/data"

export function OutputPageContent() {
  const { locale } = useLocale()
  const output = getOutputData(locale)
  const totalItems = output.sections.reduce((count, section) => count + section.items.length, 0)

  return (
    <main>
      <PageIntro
        eyebrow={output.title}
        title={output.title}
        description={output.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <FileStack className="h-4 w-4 text-[color:var(--primary)]" />
              <span>
                {totalItems} {output.countLabel}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{output.introNote}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="space-y-12">
          {output.sections.map((section, index) => (
            <Reveal key={section.title} delay={index * 90} className="page-panel p-7">
              <SectionHeading title={section.title} description={section.description} />
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {section.items.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-border/70 bg-card/65 p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.meta}</p>
                    <h3 className="mt-3 text-xl">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                    <Link href={item.href} className="mt-5 inline-flex text-sm font-medium text-primary underline decoration-border underline-offset-4">
                      {item.linkLabel}
                    </Link>
                  </article>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  )
}
