"use client"

import { useEffect, useRef } from "react"

type GiscusCommentsProps = {
  category: string
  categoryId: string
  emitMetadata: string
  inputPosition: string
  lang: string
  mapping: string
  reactionsEnabled: string
  repo: string
  repoId: string
  strict: string
  theme: string
}

export function GiscusComments({
  category,
  categoryId,
  emitMetadata,
  inputPosition,
  lang,
  mapping,
  reactionsEnabled,
  repo,
  repoId,
  strict,
  theme,
}: GiscusCommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://giscus.app/client.js"
    script.async = true
    script.crossOrigin = "anonymous"
    script.setAttribute("data-repo", repo)
    script.setAttribute("data-repo-id", repoId)
    script.setAttribute("data-category", category)
    script.setAttribute("data-category-id", categoryId)
    script.setAttribute("data-mapping", mapping)
    script.setAttribute("data-strict", strict)
    script.setAttribute("data-reactions-enabled", reactionsEnabled)
    script.setAttribute("data-emit-metadata", emitMetadata)
    script.setAttribute("data-input-position", inputPosition)
    script.setAttribute("data-theme", theme)
    script.setAttribute("data-lang", lang)

    container.appendChild(script)

    return () => {
      container.innerHTML = ""
    }
  }, [category, categoryId, emitMetadata, inputPosition, lang, mapping, reactionsEnabled, repo, repoId, strict, theme])

  return <div ref={containerRef} className="min-h-24" />
}
