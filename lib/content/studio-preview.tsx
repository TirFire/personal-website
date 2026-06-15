import * as runtime from "react/jsx-runtime"
import { evaluate } from "@mdx-js/mdx"

import { mdxCompileOptions } from "./mdx-options.mjs"
import { getMDXComponents } from "@/mdx-components"
import { buildStudioSource, type StudioMeta } from "@/lib/content/studio"

export async function renderStudioPreview(meta: StudioMeta, body: string) {
  const source = buildStudioSource(meta, body)
  const { renderToStaticMarkup } = await import("react-dom/server")
  const evaluated = await evaluate(source, {
    ...runtime,
    ...mdxCompileOptions,
    useMDXComponents: getMDXComponents,
    development: false,
  })

  const Content = evaluated.default

  return renderToStaticMarkup(
    <div className="mdx-prose-shell">
      <Content components={getMDXComponents()} />
    </div>,
  )
}
