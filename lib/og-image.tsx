import type { ReactNode } from "react"
import { ImageResponse } from "next/og"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export const ogSize = {
  width: 1200,
  height: 630,
}

export const ogContentType = "image/png"

type OgImageInput = {
  eyebrow: string
  title: string
  description: string
  tags?: string[]
  footer?: string
}

type OgFont = {
  data: ArrayBuffer
  name: string
  style: "normal"
  weight: 400 | 700
}

let cachedFonts: OgFont[] | null | undefined

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(arrayBuffer).set(buffer)
  return arrayBuffer
}

function readFontFile(filename: string) {
  const fontPath = join(process.cwd(), "public", "fonts", filename)
  return existsSync(fontPath) ? toArrayBuffer(readFileSync(fontPath)) : null
}

function getLocalChineseFonts() {
  if (cachedFonts !== undefined) return cachedFonts

  const regular = readFontFile("NotoSansSC-Regular.otf")
  const bold = readFontFile("NotoSansSC-Bold.otf")
  cachedFonts = regular
    ? [
        {
          name: "Noto Sans SC",
          data: regular,
          style: "normal",
          weight: 400,
        },
        ...(bold
          ? [
              {
                name: "Noto Sans SC",
                data: bold,
                style: "normal" as const,
                weight: 700 as const,
              },
            ]
          : []),
      ]
    : null
  return cachedFonts
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {tags.slice(0, 4).map((tag) => (
        <div
          key={tag}
          style={{
            display: "flex",
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid rgba(47, 94, 70, 0.18)",
            background: "rgba(255,255,255,0.62)",
            color: "#355847",
            fontSize: 24,
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  )
}

function BackgroundLayer(): ReactNode {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(241,248,242,1) 0%, rgba(230,240,233,1) 52%, rgba(250,244,236,1) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -40,
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(96,154,121,0.24) 0%, rgba(96,154,121,0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -80,
          bottom: -100,
          width: 420,
          height: 420,
          borderRadius: 9999,
          background: "radial-gradient(circle, rgba(197,130,86,0.16) 0%, rgba(197,130,86,0) 72%)",
        }}
      />
    </>
  )
}

export function createOgImage({ eyebrow, title, description, tags = [], footer }: OgImageInput) {
  const chineseFonts = getLocalChineseFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Noto Sans SC, sans-serif",
          color: "#143126",
        }}
      >
        {BackgroundLayer()}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "64px 72px",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#527766",
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                fontWeight: 700,
                lineHeight: 1.02,
                maxWidth: 920,
                letterSpacing: "-0.04em",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.45,
                maxWidth: 920,
                color: "#476557",
              }}
            >
              {description}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <TagList tags={tags} />
            <div
              style={{
                display: "flex",
                padding: "18px 24px",
                borderRadius: 28,
                background: "rgba(20,49,38,0.9)",
                color: "white",
                fontSize: 24,
              }}
            >
              {footer ?? "Sanhuo"}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: chineseFonts ?? undefined,
    },
  )
}
