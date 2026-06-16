"use client"

import { useEffect, useRef, useState, type TouchEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowLeftCircle, ArrowRightCircle, X } from "lucide-react"

import { useLocale } from "@/components/providers/locale-provider"
import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { getGalleryData, getGalleryGroupBySlug } from "@/lib/content/data"

type GalleryGroup = NonNullable<ReturnType<typeof getGalleryGroupBySlug>>
type GalleryPhoto = NonNullable<GalleryGroup["photos"]>[number]

function isValidPhoto(photo: GalleryPhoto | undefined): photo is GalleryPhoto {
  return typeof photo?.src === "string" && photo.src.trim().length > 0
}

export function GalleryDetailPageContent({ slug }: { slug: string }) {
  const { locale } = useLocale()
  const gallery = getGalleryData(locale)
  const group = getGalleryGroupBySlug(locale, slug)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const photos = (group?.photos ?? []).filter(isValidPhoto)
  const hasMultiplePhotos = photos.length > 1
  const safeActiveIndex = activeIndex !== null && activeIndex < photos.length ? activeIndex : null
  const activePhoto = safeActiveIndex !== null ? photos[safeActiveIndex] : null

  function closeLightbox() {
    setActiveIndex(null)
  }

  function stepPhoto(direction: -1 | 1) {
    setActiveIndex((current) => {
      if (current === null) return current
      const total = photos.length
      if (total <= 1) return current
      return (current + direction + total) % total
    })
  }

  useEffect(() => {
    if (safeActiveIndex === null) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null)
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setActiveIndex((current) => {
          if (current === null || photos.length <= 1) return current
          return (current - 1 + photos.length) % photos.length
        })
        return
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        setActiveIndex((current) => {
          if (current === null || photos.length <= 1) return current
          return (current + 1 + photos.length) % photos.length
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [safeActiveIndex, photos.length])

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null || !hasMultiplePhotos) return

    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current
    const deltaX = endX - touchStartXRef.current
    touchStartXRef.current = null

    if (Math.abs(deltaX) < 48) return
    stepPhoto(deltaX > 0 ? -1 : 1)
  }

  if (!group) {
    return (
      <main>
        <PageIntro
          eyebrow={gallery.title}
          title={locale === "zh" ? "未找到图集" : "Gallery not found"}
          description={locale === "zh" ? "这个图集还没有加入相册系统。" : "This gallery group has not been added yet."}
        />
      </main>
    )
  }

  return (
    <main>
      <PageIntro
        eyebrow={gallery.title}
        title={group.title}
        description={group.description}
        aside={
          <div className="page-intro-panel">
            <Link href="/gallery" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {locale === "zh" ? "返回相册" : "Back to gallery"}
            </Link>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{group.caption}</p>
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        {photos.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo, index) => (
              <Reveal key={`${group.slug}-${photo.src}`} delay={index * 80} className="page-panel overflow-hidden p-0">
                <button type="button" onClick={() => setActiveIndex(index)} className="block w-full text-left">
                  <div className="relative">
                    <Image
                      src={photo.src}
                      alt={photo.alt || group.title}
                      width={900}
                      height={1200}
                      sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 92vw"
                      className="aspect-[4/5] w-full object-cover"
                    />
                    {photo.videoSrc ? (
                      <span className="absolute left-3 top-3 rounded-full border border-white/35 bg-black/45 px-2.5 py-1 text-[11px] text-white">
                        {locale === "zh" ? "实况" : "Live"}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-7 text-muted-foreground">{photo.caption ?? photo.alt}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="page-panel p-7 text-sm text-muted-foreground">
            {locale === "zh" ? "这个图集暂时还没有可展示的图片。" : "This gallery group does not have displayable photos yet."}
          </Reveal>
        )}
      </section>

      {activePhoto ? (
        <div className="fixed inset-0 z-[70] bg-[rgba(16,24,19,0.82)] px-4 py-6 backdrop-blur-lg md:px-10" onClick={closeLightbox}>
          <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
            <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute right-3 top-3 z-10 inline-flex rounded-full bg-background/80 p-2 text-foreground"
                aria-label={locale === "zh" ? "关闭预览" : "Close preview"}
              >
                <X className="h-5 w-5" />
              </button>
              {hasMultiplePhotos ? (
                <>
                  <button
                    type="button"
                    onClick={() => stepPhoto(-1)}
                    className="absolute left-3 top-1/2 z-10 inline-flex -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground transition hover:bg-background"
                    aria-label={locale === "zh" ? "上一张" : "Previous image"}
                  >
                    <ArrowLeftCircle className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepPhoto(1)}
                    className="absolute right-3 top-1/2 z-10 inline-flex -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground transition hover:bg-background"
                    aria-label={locale === "zh" ? "下一张" : "Next image"}
                  >
                    <ArrowRightCircle className="h-6 w-6" />
                  </button>
                </>
              ) : null}
              <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-background/80 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.8)]">
                {activePhoto.videoSrc ? (
                  <video
                    src={activePhoto.videoSrc}
                    poster={activePhoto.src}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="max-h-[78vh] w-full bg-[rgba(12,18,14,0.92)] object-contain"
                  />
                ) : (
                  <Image
                    src={activePhoto.src}
                    alt={activePhoto.alt || group.title}
                    width={1600}
                    height={2000}
                    sizes="92vw"
                    className="max-h-[78vh] w-full bg-[rgba(12,18,14,0.92)] object-contain"
                  />
                )}
                <div className="p-5">
                  {hasMultiplePhotos && safeActiveIndex !== null ? (
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {safeActiveIndex + 1} / {photos.length}
                    </p>
                  ) : null}
                  {activePhoto.videoSrc ? (
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">
                      {locale === "zh" ? "实况图已启用视频预览" : "Live preview enabled"}
                    </p>
                  ) : null}
                  <p className="text-sm leading-7 text-muted-foreground">{activePhoto.caption ?? activePhoto.alt}</p>
                  {hasMultiplePhotos ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {locale === "zh" ? "支持键盘方向键切换，Esc 关闭，移动端左右滑动浏览。" : "Use arrow keys to navigate, Esc to close, or swipe left and right on mobile."}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
