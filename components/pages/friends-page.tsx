"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { useLocale } from "@/components/providers/locale-provider"
import { GiscusComments } from "@/components/site/giscus-comments"
import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { Button } from "@/components/ui/button"
import { getFriendsData, getSiteConfig } from "@/lib/content/data"

function isValidImageSrc(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function getInitials(value: string) {
  return value.trim().slice(0, 2).toUpperCase()
}

export function FriendsPageContent() {
  const { locale } = useLocale()
  const friends = getFriendsData(locale)
  const siteConfig = getSiteConfig(locale)
  const [copied, setCopied] = useState(false)
  const commentsConfig = siteConfig.comments
  const commentsReady = Boolean(
    commentsConfig?.enabled &&
      commentsConfig.repo &&
      commentsConfig.repoId &&
      commentsConfig.category &&
      commentsConfig.categoryId,
  )

  async function copyApplicationFormat() {
    const text = friends.applicationFormat?.trim()
    if (!text) return

    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main>
      <PageIntro
        eyebrow={friends.title}
        title={friends.title}
        description={friends.description}
        aside={
          <div className="page-intro-panel">
            <p className="text-sm leading-7 text-muted-foreground">{friends.intro}</p>
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal>
          <SectionHeading title={friends.featuredLabel ?? (locale === "zh" ? "当前收录" : "Current links")} />
        </Reveal>

        {friends.items.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {friends.items.map((item, index) => (
              <Reveal key={item.href} delay={index * 80}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group block h-full rounded-[1.55rem] border border-border/75 bg-card/65 p-5 shadow-[0_22px_50px_-42px_rgba(18,38,29,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:bg-card/85 hover:shadow-[0_28px_58px_-42px_rgba(18,38,29,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary/45"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-secondary/70 shadow-[0_18px_36px_-28px_rgba(18,38,29,0.42)]">
                      {isValidImageSrc(item.avatar) ? (
                        <Image
                          src={item.avatar}
                          alt={`${item.name} avatar`}
                          width={128}
                          height={128}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-mono text-sm text-muted-foreground">{getInitials(item.name)}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg leading-tight text-foreground">{item.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <span className="sr-only">
                    {locale === "zh" ? "访问网站" : "Visit website"}: {item.href}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-8 rounded-2xl bg-secondary/55 px-5 py-4 text-sm text-muted-foreground">
            {locale === "zh" ? "这里还没有收录友链。" : "No friends links yet."}
          </Reveal>
        )}

        <Reveal delay={160} className="mt-14 page-panel p-6 md:p-7">
          <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SectionHeading title={friends.applicationTitle} description={friends.applicationNote} />
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {locale === "zh" ? "请在下方留言里申请成为相互友链。" : "Please apply in the guestbook below if you would like to exchange links."}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-border/70 bg-card/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{friends.applicationFormatLabel ?? (locale === "zh" ? "申请格式" : "Application format")}</p>
                <Button type="button" variant="outline" onClick={() => void copyApplicationFormat()}>
                  {copied ? (friends.copiedLabel ?? (locale === "zh" ? "已复制" : "Copied")) : (friends.copyLabel ?? (locale === "zh" ? "一键复制" : "Copy"))}
                </Button>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-secondary/55 p-4 text-sm leading-7 text-muted-foreground">{friends.applicationFormat}</pre>
            </div>
          </div>
        </Reveal>

        <Reveal delay={220} className="mt-8 page-panel p-6 md:p-7">
          <SectionHeading
            title={friends.guestbookTitle ?? (locale === "zh" ? "友链留言" : "Friends guestbook")}
            description={
              friends.guestbookHint ??
              (locale === "zh" ? "使用 GitHub 登录后，留下你的友链信息即可。" : "Sign in with GitHub to leave your link information here.")
            }
          />
          <div className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-3 md:p-4">
            {commentsReady && commentsConfig ? (
              <GiscusComments
                repo={commentsConfig.repo}
                repoId={commentsConfig.repoId}
                category={commentsConfig.category}
                categoryId={commentsConfig.categoryId}
                mapping={commentsConfig.mapping}
                strict={commentsConfig.strict}
                reactionsEnabled={commentsConfig.reactionsEnabled}
                emitMetadata={commentsConfig.emitMetadata}
                inputPosition={commentsConfig.inputPosition}
                lang={commentsConfig.lang}
                theme={commentsConfig.theme}
              />
            ) : (
              <p className="text-sm leading-7 text-muted-foreground">
                {locale === "zh" ? "友链留言区还没有完成 giscus 配置。" : "The friends comment area is not configured yet."}
              </p>
            )}
          </div>
        </Reveal>
      </section>
    </main>
  )
}
