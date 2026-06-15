"use client"

import Image from "next/image"
import { Activity } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { useLocale } from "@/components/providers/locale-provider"
import { getUpdatesData } from "@/lib/content/data"

export function UpdatesPageContent() {
  const { locale } = useLocale()
  const updates = getUpdatesData(locale)

  return (
    <main>
      <PageIntro
        eyebrow={updates.title}
        title={updates.title}
        description={updates.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <Activity className="h-4 w-4 text-[color:var(--primary)]" />
              <span>
                {updates.items.length} {updates.countLabel}
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{updates.panelDescription}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-5">
          {updates.items.map((update, index) => (
            <Reveal key={`${update.date}-${update.title}`} delay={index * 90} className="page-panel p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-3 py-1 font-mono uppercase tracking-[0.16em]">{update.date}</span>
                {update.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border/70 px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(220px,0.95fr)]">
                <div>
                  <h2 className="text-2xl leading-tight">{update.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{update.summary}</p>
                  {update.blocks && update.blocks.length > 0 ? (
                    <div className="mt-5 space-y-4">
                      {update.blocks.map((block, blockIndex) => {
                        if (block.type === "paragraph") {
                          return (
                            <p key={`${update.title}-paragraph-${blockIndex}`} className="text-sm leading-7 text-muted-foreground">
                              {block.text}
                            </p>
                          )
                        }

                        const columnsClass =
                          block.columns === 2 ? "grid-cols-2" : "grid-cols-3"

                        return (
                          <div key={`${update.title}-grid-${blockIndex}`} className={`grid gap-2 ${columnsClass}`}>
                            {block.images.map((image) => (
                              <div key={`${update.title}-${image.src}`} className="overflow-hidden rounded-[1rem] border border-border/60 bg-secondary/40">
                                <Image src={image.src} alt={image.alt} width={720} height={720} className="aspect-square w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {update.image ? (
                    <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-secondary/40">
                      <Image src={update.image} alt={update.title} width={1200} height={720} className="aspect-[4/5] w-full object-cover" />
                    </div>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  )
}
