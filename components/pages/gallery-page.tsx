"use client"

import Image from "next/image"
import Link from "next/link"
import { Camera } from "lucide-react"

import { useLocale } from "@/components/providers/locale-provider"
import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { getGalleryData } from "@/lib/content/data"

type GalleryGroup = ReturnType<typeof getGalleryData>["groups"][number]
type GalleryPhoto = NonNullable<GalleryGroup["photos"]>[number]

const stackLayers = [
  { className: "gallery-stack-photo gallery-stack-left z-[1]" },
  { className: "gallery-stack-photo gallery-stack-center z-[3]" },
  { className: "gallery-stack-photo gallery-stack-right z-[2]" },
]

function isValidPhoto(photo: GalleryPhoto | undefined): photo is GalleryPhoto {
  return typeof photo?.src === "string" && photo.src.trim().length > 0
}

function getPreviewPhotos(group: GalleryGroup) {
  const photos = (group.photos ?? []).filter(isValidPhoto)
  const coverPhoto = group.cover ? photos.find((photo) => photo.src === group.cover) : undefined
  const remainingPhotos = photos.filter((photo) => photo.src !== coverPhoto?.src)

  if (coverPhoto) {
    return [remainingPhotos[0], coverPhoto, remainingPhotos[1]].filter(Boolean)
  }

  return photos.slice(0, 3)
}

export function GalleryPageContent() {
  const { locale } = useLocale()
  const gallery = getGalleryData(locale)

  return (
    <main>
      <PageIntro
        eyebrow={gallery.title}
        title={gallery.title}
        description={gallery.description}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <Camera className="h-4 w-4 text-[color:var(--primary)]" />
              <span>
                {gallery.groups.length} {gallery.countLabel}
              </span>
            </div>
            {gallery.panelNote ? <p className="mt-5 text-sm leading-7 text-muted-foreground">{gallery.panelNote}</p> : null}
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-7 lg:grid-cols-3">
          {gallery.groups.map((group, index) => {
            const previewPhotos = getPreviewPhotos(group)
            const photoCount = (group.photos ?? []).filter(isValidPhoto).length

            return (
              <Reveal key={group.slug} delay={index * 100}>
                <Link href={`/gallery/${group.slug}`} className="gallery-album-card group block">
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <SectionHeading title={group.title} />
                    <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-[0_14px_32px_-24px_rgba(18,38,29,0.4)]">
                      {photoCount}
                    </span>
                  </div>

                  <div className="gallery-stack-stage mt-6">
                    {previewPhotos.length > 0 ? (
                      previewPhotos.map((photo, photoIndex) => {
                        const layer = stackLayers[photoIndex] ?? stackLayers[1]

                        return (
                          <div
                            key={`${group.slug}-${photo.src}`}
                            className={layer.className}
                            style={{ transitionDelay: `${photoIndex * 35}ms` }}
                          >
                            <Image src={photo.src} alt={photo.alt || group.title} width={720} height={900} className="h-full w-full object-cover" />
                            {photo.videoSrc ? (
                              <span className="absolute left-3 top-3 rounded-full border border-white/35 bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-md">
                                {locale === "zh" ? "实况" : "Live"}
                              </span>
                            ) : null}
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-border/80 bg-secondary/40 text-sm text-muted-foreground">
                        {locale === "zh" ? "暂无图片" : "No photos yet"}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 mt-7">
                    {group.description ? <p className="text-sm leading-7 text-muted-foreground">{group.description}</p> : null}
                    {group.caption ? <p className="mt-3 text-xs leading-6 text-muted-foreground">{group.caption}</p> : null}
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>
    </main>
  )
}
