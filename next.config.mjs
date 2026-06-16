import createMDX from "@next/mdx"
import { createMdxPluginNames } from "./lib/content/mdx-options.mjs"

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: createMdxPluginNames(),
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bu.dusays.com",
      },
    ],
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
}

export default withMDX(nextConfig)
