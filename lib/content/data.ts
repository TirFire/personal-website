import profileData from "../../content/data/profile.json"
import socialData from "../../content/data/social.json"
import researchAreasData from "../../content/data/research-areas.json"
import outputData from "../../content/data/output.json"
import contactData from "../../content/data/contact.json"
import nowData from "../../content/data/now.json"
import cvData from "../../content/data/cv.json"
import updatesData from "../../content/data/updates.json"
import galleryData from "../../content/data/gallery.json"
import friendsData from "../../content/data/friends.json"
import siteConfigData from "../../content/data/site-config.json"
import pageCopyData from "../../content/data/page-copy.json"
import studioCopyData from "../../content/data/studio-copy.json"
import uiCopyData from "../../content/data/ui-copy.json"
import type { ActionLink, Locale } from "@/lib/i18n/messages"

type ExperienceItem = {
  period: string
  title: string
  organization: string
  description: string
}

type ProfileRecord = {
  displayName: string
  fullName: string
  role: string
  affiliation: string
  location: string
  email: string
  aboutIntroPanel: string
  aboutParagraphs: string[]
  interests: string[]
  skills: string[]
  experience: ExperienceItem[]
  education?: ExperienceItem[]
  problemDomains?: string[]
  now: string[]
  collaboration: string
  highlights: string[]
}

type SocialRecord = {
  footerLinks: ActionLink[]
  contactChannels: Array<{
    label: string
    value: string
    href?: string
  }>
}

type ResearchArea = {
  title: string
  description: string
  tags: string[]
}

type OutputItem = {
  title: string
  meta: string
  description: string
  linkLabel: string
  href: string
}

type OutputSection = {
  title: string
  description: string
  items: OutputItem[]
}

type OutputRecord = {
  title: string
  description: string
  introNote: string
  countLabel: string
  sections: OutputSection[]
}

type ContactRecord = {
  description: string
  channelsTitle: string
  collaborationTitle: string
  note: string
  collaboration: string[]
}

type NowRecord = {
  title: string
  description: string
  panelLabel: string
  panelNote: string
  currentTitle: string
  current: string[]
  readingTitle: string
  reading: string[]
  nextTitle: string
  next: string[]
}

type CvRecord = {
  title: string
  description: string
  lastUpdated: string
  downloadNote: string
  downloadHref?: string
  highlights?: string[]
  sections: Array<{
    title: string
    items: string[]
  }>
}

type UpdateRecord = {
  date: string
  title: string
  summary: string
  tags: string[]
  image?: string
  blocks?: Array<
    | {
        type: "paragraph"
        text: string
      }
    | {
        type: "imageGrid"
        columns?: 2 | 3
        images: Array<{
          src: string
          alt: string
        }>
      }
  >
}

type UpdatesRecord = {
  title: string
  description: string
  panelTitle: string
  panelDescription: string
  countLabel: string
  featuredTags?: string[]
  items: UpdateRecord[]
}

type GalleryRecord = {
  title: string
  description: string
  panelNote: string
  countLabel: string
  groups: Array<{
    slug: string
    title: string
    description: string
    caption: string
    cover?: string
    photos?: Array<{
      src: string
      alt: string
      caption?: string
      videoSrc?: string
    }>
  }>
}

type SiteLink = {
  href: string
  label: string
}

type FriendsRecord = {
  title: string
  description: string
  intro: string
  applicationTitle: string
  applicationNote: string
  applicationHref: string
  applicationLabel: string
  applicationFormatLabel?: string
  applicationFormat?: string
  copyLabel?: string
  copiedLabel?: string
  guestbookTitle?: string
  guestbookHint?: string
  featuredLabel?: string
  requestChecklist?: string[]
  items: Array<{
    name: string
    description: string
    href: string
    avatar?: string
    note?: string
  }>
}

type SiteConfigRecord = {
  metadata: {
    title: string
    description: string
    keywords: string[]
    author: string
  }
  analytics?: {
    vercel?: {
      enabled: boolean
    }
    busuanzi?: {
      enabled: boolean
      sitePvLabel: string
      siteUvLabel: string
      pagePvLabel: string
    }
  }
  comments?: {
    provider: "giscus"
    enabled: boolean
    repo: string
    repoId: string
    category: string
    categoryId: string
    mapping: string
    strict: string
    reactionsEnabled: string
    emitMetadata: string
    inputPosition: string
    lang: string
    theme: string
  }
  navigation: {
    primaryNav: SiteLink[]
    secondaryNav: SiteLink[]
    cta: ActionLink
  }
  footer: {
    description: string
    navigationTitle: string
    secondaryTitle: string
    pageLinks: SiteLink[]
    secondaryLinks: ActionLink[]
    copyright: string
    separator: string
  }
}

type PageCopyRecord = {
  home: {
    hero: {
      eyebrow: string
      title: string
      description: string
      identityLine: string
      keywords: string[]
      currentFocus: string
      primaryCta: ActionLink
      secondaryCta: ActionLink
      stats: Array<{ value: string; label: string }>
      profileLabel: string
      researchLabel: string
      writingLabel: string
      quickAccessLabel: string
      dailyQuoteLabel?: string
      dailyQuoteText?: string
      dailyQuoteFootnote?: string
    }
    research: {
      title: string
      description: string
    }
    featuredProjectsTitle: string
    latestBlogTitle: string
    latestNotesTitle: string
    updatesTitle: string
    aboutTitle: string
    aboutSummary: string
    contactTitle: string
    contactDescription: string
    contactPrimaryCta: ActionLink
    contactSecondaryCta: ActionLink
  }
  projects: {
    title: string
    description: string
    labels: {
      role: string
      status: string
      outcome: string
      links: string
    }
    countLabel: string
    introNote: string
    panelHint: string
    notFoundTitle: string
    notFoundDescription: string
    archiveNotesTitle: string
  }
  blog: {
    title: string
    description: string
    countLabel: string
    introNote: string
    panelHint: string
    notFoundTitle: string
    notFoundDescription: string
  }
  learning: {
    title: string
    description: string
    countLabel: string
    introNote: string
    panelHint: string
    notFoundTitle: string
    notFoundDescription: string
  }
  about: {
    title: string
    intro: string
    interestsTitle: string
    skillsTitle: string
    experienceTitle: string
    educationTitle?: string
    problemDomainsTitle?: string
    nowTitle: string
    collaborationTitle: string
    guestbookTitle?: string
    guestbookHint?: string
  }
}

type StudioCopyRecord = Record<string, unknown> & {
  sectionLabels: Record<"blog" | "notes" | "projects", string>
  sectionDescriptions: Record<"blog" | "notes" | "projects", string>
}

type UiCopyRecord = {
  labels: {
    openProject: string
    readArticle: string
    openNote: string
    backToProjects: string
    backToBlog: string
    backToLearning: string
    backToHome: string
    projectConclusion: string
    projectBackground: string
    projectGoal: string
    projectMethods: string
    projectChallenges: string
    projectResults: string
    projectContributions: string
    projectNextSteps: string
    relatedProjects: string
    articleComments: string
    articleCommentsHint: string
    relatedArticles: string
    relatedNotes: string
  }
}

const profiles = profileData as Record<Locale, ProfileRecord>
const socials = socialData as Record<Locale, SocialRecord>
const researchAreas = researchAreasData as Record<Locale, ResearchArea[]>
const outputs = outputData as Record<Locale, OutputRecord>
const contacts = contactData as Record<Locale, ContactRecord>
const now = nowData as Record<Locale, NowRecord>
const cv = cvData as Record<Locale, CvRecord>
const updates = updatesData as Record<Locale, UpdatesRecord>
const gallery = galleryData as Record<Locale, GalleryRecord>
const friends = friendsData as Record<Locale, FriendsRecord>
const siteConfig = siteConfigData as Record<Locale, SiteConfigRecord>
const pageCopy = pageCopyData as Record<Locale, PageCopyRecord>
const studioCopy = studioCopyData as Record<Locale, StudioCopyRecord>
const uiCopy = uiCopyData as Record<Locale, UiCopyRecord>

export function getProfile(locale: Locale) {
  return profiles[locale]
}

export function getSocial(locale: Locale) {
  return socials[locale]
}

export function getResearchAreas(locale: Locale) {
  return researchAreas[locale]
}

export function getOutputData(locale: Locale) {
  return outputs[locale]
}

export function getContactData(locale: Locale) {
  return contacts[locale]
}

export function getNowData(locale: Locale) {
  return now[locale]
}

export function getCvData(locale: Locale) {
  return cv[locale]
}

export function getUpdatesData(locale: Locale) {
  return updates[locale]
}

export function getGalleryData(locale: Locale) {
  return gallery[locale]
}

export function getGalleryGroupBySlug(locale: Locale, slug: string) {
  return gallery[locale].groups.find((group) => group.slug === slug)
}

export function getFriendsData(locale: Locale) {
  return friends[locale]
}

export function getSiteConfig(locale: Locale) {
  return siteConfig[locale]
}

export function getPageCopy(locale: Locale) {
  return pageCopy[locale]
}

export function getStudioCopy(locale: Locale) {
  return studioCopy[locale]
}

export function getUiCopy(locale: Locale) {
  return uiCopy[locale]
}
