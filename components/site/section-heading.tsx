import type { ReactNode } from "react"

import { Reveal } from "@/components/site/reveal"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        {eyebrow ? <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="section-title-animate text-3xl leading-tight md:text-4xl">{title}</h2>
        {description ? <p className="text-sm leading-7 text-muted-foreground md:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  )
}
