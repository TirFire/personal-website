import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

export const studioSessionCookieName = "studio_session"

function getConfiguredStudioPassword() {
  const value = process.env.STUDIO_PASSWORD?.trim()
  return value ? value : null
}

export function isStudioAuthConfigured() {
  return Boolean(getConfiguredStudioPassword())
}

export function isStudioOpenInCurrentEnvironment() {
  return process.env.NODE_ENV !== "production" && !isStudioAuthConfigured()
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("")
}

export async function createStudioSessionValue(password: string) {
  return sha256(`studio:${password}`)
}

export async function verifyStudioPassword(password: string) {
  const configuredPassword = getConfiguredStudioPassword()

  if (!configuredPassword) {
    return isStudioOpenInCurrentEnvironment()
  }

  const [expected, actual] = await Promise.all([
    createStudioSessionValue(configuredPassword),
    createStudioSessionValue(password),
  ])

  return expected === actual
}

export async function isStudioAuthorized(sessionValue?: string | null) {
  if (isStudioOpenInCurrentEnvironment()) {
    return true
  }

  const configuredPassword = getConfiguredStudioPassword()
  if (!configuredPassword || !sessionValue) {
    return false
  }

  const expected = await createStudioSessionValue(configuredPassword)
  return sessionValue === expected
}

export async function isStudioAuthorizedFromCookies(cookies: Pick<ReadonlyRequestCookies, "get">) {
  const sessionValue = cookies.get(studioSessionCookieName)?.value ?? null
  return isStudioAuthorized(sessionValue)
}
