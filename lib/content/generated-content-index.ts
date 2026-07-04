/* eslint-disable @typescript-eslint/no-unused-vars */
import type { BlogMeta, ContentModule, Locale, NoteMeta, NoteRelationMap, ProjectMeta } from "@/lib/content/mdx-content"
import type { ComponentType } from "react"

import zh_blog_tContent, { meta as zh_blog_tMeta } from "@/content/zh/blog/t.mdx"
import zh_blog_testContent, { meta as zh_blog_testMeta } from "@/content/zh/blog/test.mdx"
import zh_notes_bert_pre_trained_language_model_principle_analysisContent, { meta as zh_notes_bert_pre_trained_language_model_principle_analysisMeta } from "@/content/zh/notes/bert-pre-trained-language-model-principle-analysis.mdx"
import zh_notes_pretrained_language_model_bert_source_code_interpretationContent, { meta as zh_notes_pretrained_language_model_bert_source_code_interpretationMeta } from "@/content/zh/notes/pretrained-language-model-bert-source-code-interpretation.mdx"

const asBlogModule = (meta: BlogMeta, content: ComponentType): ContentModule<BlogMeta> => ({ meta, content })
const asNoteModule = (meta: NoteMeta, content: ComponentType): ContentModule<NoteMeta> => ({ meta, content })
const asProjectModule = (meta: ProjectMeta, content: ComponentType): ContentModule<ProjectMeta> => ({ meta, content })

export const generatedBlogModules: Record<Locale, ContentModule<BlogMeta>[]> = {
  en: [

  ],
  zh: [
    asBlogModule(zh_blog_tMeta as BlogMeta, zh_blog_tContent),
    asBlogModule(zh_blog_testMeta as BlogMeta, zh_blog_testContent),
  ],
}

export const generatedNoteModules: Record<Locale, ContentModule<NoteMeta>[]> = {
  en: [

  ],
  zh: [
    asNoteModule(zh_notes_bert_pre_trained_language_model_principle_analysisMeta as NoteMeta, zh_notes_bert_pre_trained_language_model_principle_analysisContent),
    asNoteModule(zh_notes_pretrained_language_model_bert_source_code_interpretationMeta as NoteMeta, zh_notes_pretrained_language_model_bert_source_code_interpretationContent),
  ],
}

export const generatedProjectModules: Record<Locale, ContentModule<ProjectMeta>[]> = {
  en: [

  ],
  zh: [

  ],
}

export const generatedNoteRelations: Record<Locale, NoteRelationMap> = {
  "en": {},
  "zh": {
    "bert-pre-trained-language-model-principle-analysis": {
      "outgoing": [],
      "backlinks": []
    },
    "pretrained-language-model-bert-source-code-interpretation": {
      "outgoing": [],
      "backlinks": []
    }
  }
}
