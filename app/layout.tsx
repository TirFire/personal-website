import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LocaleProvider } from "@/components/providers/locale-provider"
import { SiteAnalytics } from "@/components/site/site-analytics"
import { MagneticCursor } from "@/components/ui/magnetic-cursor"
import { getSiteConfig } from "@/lib/content/data"
import { defaultLocale } from "@/lib/i18n/messages"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo"
import "katex/dist/katex.min.css"
import "./globals.css"

const defaultSiteConfig = getSiteConfig(defaultLocale)

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: defaultSiteConfig.metadata.title,
    template: `%s | ${defaultSiteConfig.metadata.author}`,
  },
  description: defaultSiteConfig.metadata.description,
  keywords: defaultSiteConfig.metadata.keywords,
  authors: [{ name: defaultSiteConfig.metadata.author }],
  creator: defaultSiteConfig.metadata.author,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: defaultSiteConfig.metadata.title,
    description: defaultSiteConfig.metadata.description,
    type: "website",
    locale: defaultLocale === "zh" ? "zh_CN" : "en_US",
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSiteConfig.metadata.title,
    description: defaultSiteConfig.metadata.description,
    images: [absoluteUrl("/twitter-image")],
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={defaultLocale === "zh" ? "zh-CN" : "en"}>
      <body className="font-sans antialiased">
        <LocaleProvider>
          <MagneticCursor />
          <SiteAnalytics />
          <Header />
          {children}
          <Footer />
          <Analytics />
        </LocaleProvider>
      </body>
    </html>
  )
}
