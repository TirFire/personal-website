"use client"

import Link from "next/link"
import { Mail } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { useLocale } from "@/components/providers/locale-provider"
import { getContactData, getSiteConfig, getSocial } from "@/lib/content/data"

export function ContactPageContent() {
  const { locale } = useLocale()
  const contact = getContactData(locale)
  const social = getSocial(locale)
  const siteConfig = getSiteConfig(locale)

  const title = siteConfig.navigation.cta.label

  return (
    <main>
      <PageIntro
        eyebrow={title}
        title={title}
        description={contact.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <Mail className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{social.contactChannels[0]?.value}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{contact.note}</p>
          </div>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="page-panel p-7">
            <SectionHeading title={contact.channelsTitle} />
            <div className="mt-6 space-y-4">
              {social.contactChannels.map((channel) => (
                <article key={channel.label} className="rounded-2xl border border-border/70 bg-card/65 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{channel.label}</p>
                  {channel.href ? (
                    <Link href={channel.href} className="mt-3 inline-flex text-base font-medium text-primary underline decoration-border underline-offset-4">
                      {channel.value}
                    </Link>
                  ) : (
                    <p className="mt-3 text-base font-medium text-foreground">{channel.value}</p>
                  )}
                </article>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120} className="page-panel p-7">
            <SectionHeading title={contact.collaborationTitle} />
            <ul className="mt-6 space-y-3">
              {contact.collaboration.map((item) => (
                <li key={item} className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm leading-7 text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
