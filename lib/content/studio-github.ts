import siteConfigData from "@/content/data/site-config.json"

type StudioLocale = "en" | "zh"
type StudioSection = "blog" | "notes" | "projects"

type GitHubContentFile = {
  name: string
  path: string
  sha: string
  type: "file" | "dir"
  content?: string
  encoding?: string
}

type GitHubRuntimeInfo = {
  backend: "github"
  readSource: "github"
  writeEnabled: true
  repo: string
  branch: string
}

type GitHubFileRecord = {
  locale: StudioLocale
  section: StudioSection
  slug: string
  source: string
}

type GitHubDataFileMap = Record<
  | "profile"
  | "social"
  | "research-areas"
  | "now"
  | "updates"
  | "output"
  | "cv"
  | "gallery"
  | "friends"
  | "contact"
  | "site-config",
  string
>

const githubDataFileMap: GitHubDataFileMap = {
  profile: "profile.json",
  social: "social.json",
  "research-areas": "research-areas.json",
  now: "now.json",
  updates: "updates.json",
  output: "output.json",
  cv: "cv.json",
  gallery: "gallery.json",
  friends: "friends.json",
  contact: "contact.json",
  "site-config": "site-config.json",
}

function getFallbackRepo() {
  const englishConfig = siteConfigData.en as { comments?: { repo?: string } }
  const chineseConfig = siteConfigData.zh as { comments?: { repo?: string } }
  return englishConfig.comments?.repo || chineseConfig.comments?.repo || "TirFire/personal-website"
}

function getGitHubRepoConfig() {
  const token = process.env.STUDIO_GITHUB_TOKEN?.trim()
  const repo = process.env.STUDIO_GITHUB_REPO?.trim() || getFallbackRepo()
  const branch = process.env.STUDIO_GITHUB_BRANCH?.trim() || process.env.VERCEL_GIT_COMMIT_REF?.trim() || "main"

  if (!token || !repo) {
    return null
  }

  const [owner, name] = repo.split("/")
  if (!owner || !name) {
    throw new Error("Invalid STUDIO_GITHUB_REPO. Use the form owner/repo.")
  }

  return {
    token,
    repo,
    owner,
    name,
    branch,
    committerName: process.env.STUDIO_GITHUB_COMMITTER_NAME?.trim() || "Studio Bot",
    committerEmail:
      process.env.STUDIO_GITHUB_COMMITTER_EMAIL?.trim() || "41898282+github-actions[bot]@users.noreply.github.com",
  }
}

function encodeRepoPath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

async function githubRequest(path: string, init?: RequestInit) {
  const config = getGitHubRepoConfig()
  if (!config) {
    throw new Error("GitHub Studio is not configured. Set STUDIO_GITHUB_TOKEN first.")
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `GitHub API request failed with status ${response.status}.`
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return response
}

function decodeGithubFileContent(file: GitHubContentFile) {
  if (file.encoding === "base64" && typeof file.content === "string") {
    return Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8")
  }

  return typeof file.content === "string" ? file.content : ""
}

export function isStudioGithubEnabled() {
  return Boolean(getGitHubRepoConfig())
}

export function getStudioGithubRuntimeInfo(): GitHubRuntimeInfo | null {
  const config = getGitHubRepoConfig()
  if (!config) return null

  return {
    backend: "github",
    readSource: "github",
    writeEnabled: true,
    repo: config.repo,
    branch: config.branch,
  }
}

export function getGithubStudioItemPath(locale: StudioLocale, section: StudioSection, slug: string) {
  return `content/${locale}/${section}/${slug}.mdx`
}

export function getGithubStudioDataPath(key: keyof GitHubDataFileMap) {
  return `content/data/${githubDataFileMap[key]}`
}

export async function listGithubDirectoryFiles(repoPath: string) {
  const config = getGitHubRepoConfig()
  if (!config) {
    return []
  }

  try {
    const response = await githubRequest(
      `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.name)}/contents/${encodeRepoPath(repoPath)}?ref=${encodeURIComponent(config.branch)}`,
    )
    const payload = (await response.json()) as GitHubContentFile[] | GitHubContentFile
    const entries = Array.isArray(payload) ? payload : [payload]

    return entries.filter((entry) => entry.type === "file").map((entry) => entry.name)
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return []
    }

    throw error
  }
}

export async function readGithubTextFile(repoPath: string) {
  const config = getGitHubRepoConfig()
  if (!config) {
    throw new Error("GitHub Studio is not configured. Set STUDIO_GITHUB_TOKEN first.")
  }

  const response = await githubRequest(
    `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.name)}/contents/${encodeRepoPath(repoPath)}?ref=${encodeURIComponent(config.branch)}`,
  )
  const payload = (await response.json()) as GitHubContentFile

  return {
    sha: payload.sha,
    content: decodeGithubFileContent(payload),
    path: payload.path,
  }
}

async function putGithubFile(repoPath: string, contentBase64: string, message: string, sha?: string) {
  const config = getGitHubRepoConfig()
  if (!config) {
    throw new Error("GitHub Studio is not configured. Set STUDIO_GITHUB_TOKEN first.")
  }

  await githubRequest(`/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.name)}/contents/${encodeRepoPath(repoPath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contentBase64,
      sha,
      branch: config.branch,
      committer: {
        name: config.committerName,
        email: config.committerEmail,
      },
    }),
  })
}

export async function writeGithubTextFile(repoPath: string, source: string, message: string) {
  let sha: string | undefined

  try {
    const current = await readGithubTextFile(repoPath)
    sha = current.sha
  } catch (error) {
    if (!(error && typeof error === "object" && "status" in error && error.status === 404)) {
      throw error
    }
  }

  await putGithubFile(repoPath, Buffer.from(source, "utf8").toString("base64"), message, sha)
}

export async function createGithubTextFile(repoPath: string, source: string, message: string) {
  try {
    await readGithubTextFile(repoPath)
    throw new Error("A file with this slug already exists.")
  } catch (error) {
    if (!(error && typeof error === "object" && "status" in error && error.status === 404)) {
      throw error
    }
  }

  await putGithubFile(repoPath, Buffer.from(source, "utf8").toString("base64"), message)
}

export async function deleteGithubFile(repoPath: string, message: string) {
  const config = getGitHubRepoConfig()
  if (!config) {
    throw new Error("GitHub Studio is not configured. Set STUDIO_GITHUB_TOKEN first.")
  }

  const current = await readGithubTextFile(repoPath)

  await githubRequest(`/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.name)}/contents/${encodeRepoPath(repoPath)}`, {
    method: "DELETE",
    body: JSON.stringify({
      message,
      sha: current.sha,
      branch: config.branch,
      committer: {
        name: config.committerName,
        email: config.committerEmail,
      },
    }),
  })
}

export async function listGithubStudioMdxFiles(): Promise<GitHubFileRecord[]> {
  const scope = [
    { locale: "zh" as const, section: "blog" as const },
    { locale: "zh" as const, section: "notes" as const },
    { locale: "zh" as const, section: "projects" as const },
    { locale: "en" as const, section: "blog" as const },
    { locale: "en" as const, section: "notes" as const },
    { locale: "en" as const, section: "projects" as const },
  ]

  const groupedRecords = await Promise.all(
    scope.map(async ({ locale, section }) => {
      const fileNames = await listGithubDirectoryFiles(`content/${locale}/${section}`)

      return Promise.all(
        fileNames
          .filter((entry) => entry.endsWith(".mdx"))
          .sort((left, right) => left.localeCompare(right))
          .map(async (fileName) => {
            const slug = fileName.replace(/\.mdx$/, "")
            const source = (await readGithubTextFile(getGithubStudioItemPath(locale, section, slug))).content
            return {
              locale,
              section,
              slug,
              source,
            }
          }),
      )
    }),
  )

  return groupedRecords.flat()
}

export async function readGithubStudioMdxFile(locale: StudioLocale, section: StudioSection, slug: string) {
  return readGithubTextFile(getGithubStudioItemPath(locale, section, slug))
}

export async function readGithubStudioDataFile(
  key: keyof GitHubDataFileMap,
): Promise<Record<StudioLocale, Record<string, unknown> | Array<Record<string, unknown>>>> {
  const source = (await readGithubTextFile(getGithubStudioDataPath(key))).content
  return JSON.parse(source) as Record<StudioLocale, Record<string, unknown> | Array<Record<string, unknown>>>
}

export async function writeGithubStudioDataFile(
  key: keyof GitHubDataFileMap,
  value: Record<StudioLocale, Record<string, unknown> | Array<Record<string, unknown>>>,
  message: string,
) {
  await writeGithubTextFile(getGithubStudioDataPath(key), `${JSON.stringify(value, null, 2)}\n`, message)
}

export async function uploadGithubBinaryFile(repoPath: string, bytes: Uint8Array, message: string) {
  await putGithubFile(repoPath, Buffer.from(bytes).toString("base64"), message)
}
