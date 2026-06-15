"use client"

import Script from "next/script"

import { useLocale } from "@/components/providers/locale-provider"
import { getSiteConfig } from "@/lib/content/data"

export function SiteAnalytics() {
  const { locale } = useLocale()
  const analytics = getSiteConfig(locale).analytics

  return (
    <>
      {analytics?.busuanzi?.enabled ? (
        <Script
          id="busuanzi-script"
          src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  )
}
