"use client"

import { useState } from "react"
import { LockKeyhole } from "lucide-react"

import { PageIntro } from "@/components/site/page-intro"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocale } from "@/components/providers/locale-provider"

type StudioAccessPageProps = {
  authConfigured: boolean
}

export function StudioAccessPage({ authConfigured }: StudioAccessPageProps) {
  const { locale } = useLocale()
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!password.trim()) {
      setMessage(locale === "zh" ? "请输入访问密码。" : "Enter the access password.")
      return
    }

    setPending(true)
    setMessage("")

    try {
      const response = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? (locale === "zh" ? "登录失败。" : "Login failed."))
        return
      }

      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : locale === "zh" ? "登录失败。" : "Login failed.")
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="pb-24">
      <section className="mx-auto max-w-5xl px-6 pt-16 md:px-10 md:pt-24">
        <PageIntro
          eyebrow={locale === "zh" ? "Studio 访问保护" : "Studio access control"}
          title={locale === "zh" ? "内容工作台已加锁" : "Studio is locked"}
          description={
            authConfigured
              ? locale === "zh"
                ? "这是站点的内容编辑后台。请输入访问密码后再继续。"
                : "This is the editing workspace for the site. Enter the access password to continue."
              : locale === "zh"
                ? "当前环境还没有配置 Studio 访问密码。生产环境建议设置 `STUDIO_PASSWORD`。"
                : "Studio access is not configured yet. Set `STUDIO_PASSWORD` in production."
          }
          aside={
            <div className="page-intro-panel">
              <div className="page-intro-metric">
                <LockKeyhole className="h-4 w-4 text-[color:var(--primary)]" />
                <span>{locale === "zh" ? "仅授权访问" : "Restricted access"}</span>
              </div>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {locale === "zh"
                  ? "这个入口会同时保护页面和相关编辑接口，避免任何人直接进入后台或绕过前端调用 API。"
                  : "This gate protects both the page and the related editing APIs so visitors cannot bypass the UI and call the endpoints directly."}
              </p>
            </div>
          }
        />
      </section>

      <section className="mx-auto max-w-xl px-6 py-12 md:px-10">
        <div className="page-panel p-6 md:p-8">
          {authConfigured ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm text-muted-foreground">
                {locale === "zh" ? "访问密码" : "Access password"}
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2"
                  autoComplete="current-password"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? (locale === "zh" ? "验证中..." : "Checking...") : locale === "zh" ? "进入 Studio" : "Enter Studio"}
                </Button>
              </div>
              {message ? <p className="text-sm text-destructive">{message}</p> : null}
            </form>
          ) : (
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>{locale === "zh" ? "请先在环境变量中设置 `STUDIO_PASSWORD`。" : "Set `STUDIO_PASSWORD` in your environment first."}</p>
              <p>
                {locale === "zh"
                  ? "本地开发如果不设置密码，系统会默认放行；生产环境请务必配置。"
                  : "Local development stays open when no password is configured; production should always define one."}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
