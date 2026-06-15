"use client"

import type { ReactNode } from "react"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { getSiteConfig } from "@/lib/content/data"
import { defaultLocale, messages, type Locale } from "@/lib/i18n/messages"

const STORAGE_KEY = "research-home-locale"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: (typeof messages)[Locale]
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const activeMessages = messages[locale]

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY)
    if (storedLocale === "en" || storedLocale === "zh") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(storedLocale)
      return
    }

    const browserLocale = window.navigator.language.toLowerCase()
    if (browserLocale.startsWith("zh")) {
      setLocaleState("zh")
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
    const siteConfig = getSiteConfig(locale)
    document.title = siteConfig.metadata.title

    const descriptionMeta = document.querySelector('meta[name="description"]')
    descriptionMeta?.setAttribute("content", siteConfig.metadata.description)

    const keywordsMeta = document.querySelector('meta[name="keywords"]')
    keywordsMeta?.setAttribute("content", siteConfig.metadata.keywords.join(", "))

    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
      messages: activeMessages,
    }),
    [activeMessages, locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }

  return context
}
