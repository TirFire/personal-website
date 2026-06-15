"use client"

import { Radar } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { getNowData } from "@/lib/content/data"

function StringListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Reveal className="page-panel p-7">
      <SectionHeading title={title} />
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm leading-7 text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

export function NowPageContent() {
  const { locale } = useLocale()
  const now = getNowData(locale)

  return (
    <main>
      <PageIntro
        eyebrow={now.title}
        title={now.title}
        description={now.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <Radar className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{now.panelLabel}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{now.panelNote}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          <StringListSection title={now.currentTitle} items={now.current} />
          <StringListSection title={now.readingTitle} items={now.reading} />
          <StringListSection title={now.nextTitle} items={now.next} />
        </div>
      </section>
    </main>
  )
}
