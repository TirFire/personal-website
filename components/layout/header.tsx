"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { useLocale } from "@/components/providers/locale-provider"
import { getProfile, getSiteConfig } from "@/lib/content/data"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { locale, setLocale, messages } = useLocale()
  const pathname = usePathname()
  const profile = getProfile(locale)
  const siteConfig = getSiteConfig(locale)
  const navItems = siteConfig.navigation.primaryNav

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <nav className="flex h-[4.5rem] items-center justify-between gap-6 md:h-20">
            <Link href="/" className="min-w-0">
              <div className="text-sm font-semibold tracking-tight md:text-base">{profile.fullName}</div>
              <div className="mt-1 hidden text-xs text-muted-foreground md:block">{profile.affiliation}</div>
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm transition-colors",
                    pathname === item.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {siteConfig.navigation.secondaryNav.map((item) => (
                <Link key={item.label} href={item.href} className="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ))}
              <div className="inline-flex items-center rounded-full border border-border bg-card p-1" aria-label={messages.languageSwitch.label}>
                {(["en", "zh"] as const).map((option) => {
                  const isActive = option === locale

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLocale(option)}
                      className={cn(
                        "min-h-9 min-w-11 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {messages.languageSwitch.options[option]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <div className="inline-flex items-center rounded-full border border-border bg-card p-1" aria-label={messages.languageSwitch.label}>
                {(["en", "zh"] as const).map((option) => {
                  const isActive = option === locale

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLocale(option)}
                      className={cn(
                        "min-h-9 min-w-10 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {messages.languageSwitch.options[option]}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2"
                aria-label={messages.header.openMenu}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/" className="text-lg font-semibold tracking-tight" onClick={() => setIsMobileMenuOpen(false)}>
                  {profile.fullName}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{profile.affiliation}</p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2"
                aria-label={messages.header.closeMenu}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "inline-flex min-h-12 items-center text-3xl font-semibold transition-colors",
                    pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {siteConfig.navigation.secondaryNav.map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="inline-flex min-h-10 items-center">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
