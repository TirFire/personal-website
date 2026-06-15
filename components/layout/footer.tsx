"use client"

import Link from "next/link"

import { useLocale } from "@/components/providers/locale-provider"
import { BusuanziStats } from "@/components/site/busuanzi-stats"
import { getProfile, getSiteConfig, getSocial } from "@/lib/content/data"

export function Footer() {
  const { locale } = useLocale()
  const profile = getProfile(locale)
  const social = getSocial(locale)
  const siteConfig = getSiteConfig(locale)

  return (
    <footer className="border-t border-border/70 bg-card/45">
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-18">
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight">
              {profile.fullName}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">{profile.role}</p>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">{siteConfig.footer.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {social.footerLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{profile.email}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">{siteConfig.footer.navigationTitle}</h4>
            <ul className="mt-4 space-y-3">
              {siteConfig.footer.pageLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">{siteConfig.footer.secondaryTitle}</h4>
            <ul className="mt-4 space-y-3">
              {siteConfig.footer.secondaryLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            {siteConfig.footer.separator} {new Date().getFullYear()} {profile.fullName}. {siteConfig.footer.copyright}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            {profile.affiliation} {siteConfig.footer.separator} {profile.location}
            <BusuanziStats />
          </p>
        </div>
      </div>
    </footer>
  )
}
