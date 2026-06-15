export type ReadingTimeLocale = "zh" | "en"

const CJK_CHARACTER_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g
const LATIN_WORD_PATTERN = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g

function countCjkCharacters(source: string) {
  return source.match(CJK_CHARACTER_PATTERN)?.length ?? 0
}

function countLatinWords(source: string) {
  return source.match(LATIN_WORD_PATTERN)?.length ?? 0
}

export function estimateReadingTimeText(source: string, locale: ReadingTimeLocale) {
  const cjkCharacters = countCjkCharacters(source)
  const latinWords = countLatinWords(source)
  const cjkMinutes = cjkCharacters / 400
  const latinMinutes = latinWords / 220
  const minutes = Math.max(1, Math.ceil(cjkMinutes + latinMinutes))

  return locale === "zh" ? `${minutes} 分钟阅读` : `${minutes} min read`
}
