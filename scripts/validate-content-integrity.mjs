import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const contentRoot = path.join(root, "content")
const suspiciousPattern = /[鍏涓浣鐮璇杩褰鏍椤娆绗鐩鎴鍙闈缁閫璁]/u

async function walk(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const target = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await walk(target, results)
      continue
    }

    results.push(target)
  }

  return results
}

function formatPath(filePath) {
  return path.relative(root, filePath).replaceAll("\\", "/")
}

async function main() {
  const files = await walk(contentRoot)
  const problems = []

  for (const file of files) {
    const text = await readFile(file, "utf8")

    if (file.endsWith(".json")) {
      try {
        JSON.parse(text)
      } catch (error) {
        problems.push(`${formatPath(file)}: invalid JSON (${error instanceof Error ? error.message : String(error)})`)
      }
    }

    if (text.includes("\uFFFD")) {
      problems.push(`${formatPath(file)}: contains replacement characters`)
    }

    if (file.includes(`${path.sep}zh${path.sep}`) && suspiciousPattern.test(text)) {
      problems.push(`${formatPath(file)}: contains suspicious mojibake-like characters`)
    }
  }

  if (problems.length > 0) {
    console.error("Content integrity check failed:\n")
    for (const problem of problems) {
      console.error(`- ${problem}`)
    }
    process.exit(1)
  }

  console.log("Content integrity check passed.")
}

await main()
