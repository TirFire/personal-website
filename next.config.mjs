import createMDX from "@next/mdx"
import { mdxPluginNames } from "./lib/content/mdx-options.mjs"

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: mdxPluginNames,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
