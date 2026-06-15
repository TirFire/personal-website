import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { fileURLToPath } from "node:url"
import remarkWikiLinks from "./remark-wiki-links.mjs"

const remarkWikiLinksPath = fileURLToPath(new URL("./remark-wiki-links.mjs", import.meta.url))

export const mdxPluginNames = {
  remarkPlugins: [remarkWikiLinksPath, "remark-gfm", "remark-math"],
}

export const mdxRemarkPlugins = [remarkWikiLinks, remarkGfm, remarkMath]

export const mdxCompileOptions = {
  remarkPlugins: mdxRemarkPlugins,
}
