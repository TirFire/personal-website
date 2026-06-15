export type Locale = "en" | "zh"

export type SiteLink = {
  href: string
  label: string
}

export type ActionLink = SiteLink & {
  external?: boolean
}

export type Messages = {
  languageSwitch: {
    label: string
    options: Record<Locale, string>
  }
  header: {
    openMenu: string
    closeMenu: string
  }
}

export const defaultLocale: Locale = "zh"

export const messages: Record<Locale, Messages> = {
  en: {
    languageSwitch: {
      label: "Language",
      options: {
        en: "EN",
        zh: "中文",
      },
    },
    header: {
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
  },
  zh: {
    languageSwitch: {
      label: "语言",
      options: {
        en: "EN",
        zh: "中文",
      },
    },
    header: {
      openMenu: "打开菜单",
      closeMenu: "关闭菜单",
    },
  },
}
