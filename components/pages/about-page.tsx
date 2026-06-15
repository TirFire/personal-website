"use client"

import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { useLocale } from "@/components/providers/locale-provider"
import { GiscusComments } from "@/components/site/giscus-comments"
import { PageIntro } from "@/components/site/page-intro"
import { Reveal } from "@/components/site/reveal"
import { SectionHeading } from "@/components/site/section-heading"
import { getContactData, getPageCopy, getProfile, getSiteConfig, getSocial } from "@/lib/content/data"

export function AboutPageContent() {
  const { locale } = useLocale()
  const contact = getContactData(locale)
  const pageCopy = getPageCopy(locale)
  const profile = getProfile(locale)
  const siteConfig = getSiteConfig(locale)
  const social = getSocial(locale)
  const commentsConfig = siteConfig.comments
  const commentsReady = Boolean(
    commentsConfig?.enabled &&
      commentsConfig.repo &&
      commentsConfig.repoId &&
      commentsConfig.category &&
      commentsConfig.categoryId,
  )

  return (
    <main>
      <PageIntro
        eyebrow={pageCopy.about.title}
        title={pageCopy.about.title}
        aside={
          <div className="page-intro-panel">
            <div className="page-intro-metric">
              <GraduationCap className="h-4 w-4 text-[color:var(--primary)]" />
              <span>{profile.affiliation}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">{profile.aboutIntroPanel}</p>
          </div>
        }
      />

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 md:px-10 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-8 md:space-y-10">
            <Reveal className="page-panel p-5 md:p-7">
              {profile.aboutParagraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-muted-foreground [&:not(:first-child)]:mt-4">
                  {paragraph}
                </p>
              ))}
            </Reveal>

            <Reveal delay={100} className="page-panel p-5 md:p-7">
              <SectionHeading title={pageCopy.about.interestsTitle} />
              <ul className="mt-6 space-y-3">
                {profile.interests.map((interest) => (
                  <li key={interest} className="rounded-2xl bg-secondary/70 px-4 py-3 text-sm leading-7 text-foreground">
                    {interest}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={150} className="page-panel p-5 md:p-7">
              <SectionHeading title={pageCopy.about.skillsTitle} />
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-border/70 px-3 py-2 text-sm text-muted-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200} className="page-panel p-5 md:p-7">
              <SectionHeading
                title={pageCopy.about.guestbookTitle ?? (locale === "zh" ? "留言" : "Guestbook")}
                description={
                  pageCopy.about.guestbookHint ??
                  (locale === "zh"
                    ? "使用 GitHub 登录后，可以在这里留言、提问或留下合作想法。"
                    : "Sign in with GitHub to leave a note, question, or collaboration idea.")
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
                    {locale === "zh" ? "留言区还没有完成 giscus 配置。" : "The giscus comment area is not configured yet."}
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          <div className="space-y-8 md:space-y-10">
            <Reveal delay={80} className="page-panel p-5 md:p-7">
              <SectionHeading title={pageCopy.about.experienceTitle} />
              <div className="mt-7 space-y-5">
                {profile.experience.map((item, index) => (
                  <Reveal key={`${item.period}-${item.title}`} delay={index * 100}>
                    <article className="rounded-2xl border border-border/70 bg-card/65 p-5">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono uppercase tracking-[0.18em]">{item.period}</span>
                        <span>{item.organization}</span>
                      </div>
                      <h3 className="mt-3 text-xl">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            {profile.education && profile.education.length > 0 ? (
              <Reveal delay={130} className="page-panel p-5 md:p-7">
                <SectionHeading title={pageCopy.about.educationTitle ?? (locale === "zh" ? "教育背景" : "Education")} />
                <div className="mt-7 space-y-5">
                  {profile.education.map((item, index) => (
                    <Reveal key={`${item.period}-${item.title}`} delay={index * 100}>
                      <article className="rounded-2xl border border-border/70 bg-card/65 p-5">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono uppercase tracking-[0.18em]">{item.period}</span>
                          <span>{item.organization}</span>
                        </div>
                        <h3 className="mt-3 text-xl">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            ) : null}

            <Reveal id="contact" delay={180} className="page-panel p-5 md:p-7">
              <SectionHeading title={contact.channelsTitle} />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {social.contactChannels.map((channel) => {
                  const content = (
                    <>
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{channel.label}</p>
                      <p className="mt-3 text-sm leading-7 text-foreground">{channel.value}</p>
                    </>
                  )

                  return channel.href ? (
                    <Link
                      key={`${channel.label}-${channel.value}`}
                      href={channel.href}
                      target={channel.href.startsWith("http") ? "_blank" : undefined}
                      rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                      className="rounded-2xl border border-border/70 bg-card/65 p-5 transition-colors hover:border-primary/40"
                    >
                      {content}
                    </Link>
                  ) : (
                    <article key={`${channel.label}-${channel.value}`} className="rounded-2xl border border-border/70 bg-card/65 p-5">
                      {content}
                    </article>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  )
}
