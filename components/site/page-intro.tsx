import type { ReactNode } from "react"

import { Reveal } from "@/components/site/reveal"

type PageIntroProps = {
  eyebrow: string
  title: string
  description?: string
  aside?: ReactNode
}

export function PageIntro({ eyebrow, title, description, aside }: PageIntroProps) {
  return (
    <section className="page-intro-shell border-b border-border/70">
      <div className="page-intro-aurora absolute inset-0 -z-20" />
      <div className="hero-noise absolute inset-0 -z-10 opacity-50" />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-12 pt-28 md:px-10 md:pb-16 md:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <Reveal className="max-w-3xl space-y-5">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
          <h1 className="text-4xl leading-[1.02] md:text-6xl">{title}</h1>
          {description ? <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{description}</p> : null}
        </Reveal>
        {aside ? (
          <Reveal delay={140} className="lg:justify-self-end">
            {aside}
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
