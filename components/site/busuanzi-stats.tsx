"use client"

import { useLocale } from "@/components/providers/locale-provider"
import { getSiteConfig } from "@/lib/content/data"

type BusuanziStatsProps = {
  mode?: "site" | "page"
  className?: string
}

export function BusuanziStats({ mode = "site", className }: BusuanziStatsProps) {
  const { locale } = useLocale()
  const busuanzi = getSiteConfig(locale).analytics?.busuanzi

  if (!busuanzi?.enabled) {
    return null
  }

  if (mode === "page") {
    return (
      <span id="busuanzi_container_page_pv" className={className}>
        {busuanzi.pagePvLabel} <span id="busuanzi_value_page_pv" />
      </span>
    )
  }

  return (
    <span className={className}>
      <span id="busuanzi_container_site_pv">
        {busuanzi.sitePvLabel} <span id="busuanzi_value_site_pv" />
      </span>
      <span className="mx-2 text-border">/</span>
      <span id="busuanzi_container_site_uv">
        {busuanzi.siteUvLabel} <span id="busuanzi_value_site_uv" />
      </span>
    </span>
  )
}
