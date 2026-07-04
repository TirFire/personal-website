# AGENTS

This file is the AI-facing project bootstrap for `personal-website`.

## Scope

- Treat this as the default orientation guide before reading the whole repo.
- This guide is intentionally code-centric.
- It focuses on the main project skeleton in:
  - `app/`
  - `components/`
  - `lib/`
- Large assets and most content payloads are intentionally not the first priority for orientation.

## Main Entry

- `app/layout.tsx`
  - Global app shell.
  - Wires `LocaleProvider`, `Header`, `Footer`, analytics, cursor effects, metadata base, and global CSS.
- `app/page.tsx`
  - Home route wrapper.
  - Delegates to `components/pages/home-page.tsx`.
  - Uses `buildPageMetadata()` for route metadata.

## Route Layer

- `app/**/page.tsx`
  - Route wrappers are intentionally thin.
  - In most cases they:
    - export metadata
    - render one page component from `components/pages/*`
- Dynamic detail routes:
  - `app/blog/[slug]/page.tsx`
  - `app/learning/[slug]/page.tsx`
  - `app/projects/[slug]/page.tsx`
  - `app/gallery/[slug]/page.tsx`
- OG image routes:
  - `app/opengraph-image.tsx`
  - `app/twitter-image.tsx`
  - `app/**/[slug]/opengraph-image.tsx`

## Page Component Layer

- `components/pages/*`
  - Real page implementations live here.
  - Start here for page behavior, filtering, rendering structure, and user-facing logic.
- Shared page scaffolding:
  - `components/site/page-intro.tsx`
  - `components/site/reveal.tsx`
  - `components/site/section-heading.tsx`
- Common graph hubs:
  - `useLocale()`
  - `Reveal()`
  - `PageIntro()`
  - `SectionHeading()`

## Locale & Runtime

- `components/providers/locale-provider.tsx`
  - Central client-side locale state.
  - Reads browser language and local storage.
  - Updates document language and some meta tags on the client.
- `lib/i18n/messages.ts`
  - Base locale types and static message primitives.
- `lib/content/data.ts`
  - Main structured-content accessor layer.
  - Reads JSON-backed site/profile/navigation/page-copy data and exposes typed getters.

## Content System

Two parallel content sources exist:

1. Structured JSON data
   - Source: `content/data/*.json`
   - Accessed through: `lib/content/data.ts`
   - Used for:
     - site config
     - profile/about/contact
     - updates/gallery/friends
     - UI copy and page copy

2. MDX content archives
   - Source: `content/{locale}/{blog|notes|projects}/*.mdx`
   - Indexed into generated code by:
     - `scripts/generate-content-index.mjs`
     - `lib/content/generated-content-index.ts`
   - Read through:
     - `lib/content/mdx-content.ts`

## MDX Query Layer

- `lib/content/mdx-content.ts`
  - Main query surface for blog/note/project entries.
  - Handles:
    - sorting
    - draft filtering
    - tag collection
    - slug lookup
    - related-entry resolution
    - note backlink/outgoing-link resolution
- If a task involves blog, note, or project detail pages, start here.

## Studio Authoring System

The Studio pipeline is a core subsystem.

### UI

- `app/studio/page.tsx`
- `components/pages/studio-page.tsx`

### API routes

- `app/api/studio/items/route.ts`
- `app/api/studio/item/route.ts`
- `app/api/studio/data/route.ts`
- `app/api/studio/assets/route.ts`
- `app/api/studio/preview/route.ts`
- `app/api/studio/references/route.ts`

### Core filesystem/content orchestration

- `lib/content/studio.ts`
  - Central CRUD and orchestration layer.
  - Responsible for:
    - listing/editing MDX items
    - listing/editing structured JSON data
    - validating content
    - writing files
    - regenerating the content index

### Parsing and import helpers

- `lib/content/studio-source.ts`
  - Parses exported `meta`
  - Normalizes imported markdown/obsidian-like content
  - Handles wiki-link, image, and callout adaptation
- `lib/content/studio-preview.tsx`
  - Preview rendering support
- `lib/content/mdx-options.mjs`
  - Shared MDX compile options

### Practical rule

- If a task mentions `/studio`, content editing, file import, Obsidian compatibility, or content regeneration:
  - inspect `components/pages/studio-page.tsx`
  - then `app/api/studio/*`
  - then `lib/content/studio.ts`
  - then `lib/content/studio-source.ts`

## SEO & Metadata

- `lib/seo.ts`
  - Shared metadata builder layer.
  - Core helpers:
    - `getSiteOrigin()`
    - `absoluteUrl()`
    - `buildPageMetadata()`
    - JSON-LD builders for blog/note/project pages
- `lib/og-image.tsx`
  - Central OG image renderer.
  - Handles local Chinese font loading and image composition.

## Visual System

- `components/ui/*`
  - Shared UI primitive layer.
  - Many files are wrapped Radix/shadcn-style primitives plus custom variants.
- Important concentrated areas from the graph:
  - `Carousel Primitives`
  - `Chart UI System`
  - `Toast System`
  - `Dialog & Command Primitives`

## High-Value Communities

- `App Shell & Locale Runtime`
  - `app/layout.tsx`
  - locale provider
  - header/footer/site analytics
- `Content Data Accessors`
  - `lib/content/data.ts`
  - typed getters for JSON-backed site content
- `MDX Content Index & Relations`
  - generated content modules
  - entry normalization/tag/related lookup
- `Studio API Routes`
  - route handlers for item/data/preview/assets/references
- `Studio File CRUD Pipeline`
  - file writes, reads, validation, regeneration
- `Obsidian Import & Wiki Link Parsing`
  - markdown import compatibility path
- `SEO Builders & Site Config`
  - metadata builders and canonical URL logic
- `OG Image Renderer`
  - social card generation

## Recommended Read Order

For a new AI session, the fastest order is:

1. `app/layout.tsx`
2. `app/page.tsx`
3. `components/providers/locale-provider.tsx`
4. `lib/content/data.ts`
5. `lib/content/mdx-content.ts`
6. `lib/content/studio.ts`
7. `lib/content/studio-source.ts`
8. `lib/seo.ts`
9. The specific page component related to the task in `components/pages/*`

## Task Routing Heuristics

- If the task is about page text, navigation, profile/about/contact, friends, gallery, or updates:
  - start with `lib/content/data.ts`
  - then inspect `content/data/*.json`
- If the task is about blog/note/project listing or detail logic:
  - start with `lib/content/mdx-content.ts`
- If the task is about `/studio`:
  - start with `components/pages/studio-page.tsx`
  - then `app/api/studio/*`
  - then `lib/content/studio.ts`
- If the task is about metadata, sharing cards, canonical URLs, sitemap, or OG:
  - start with `lib/seo.ts` and `lib/og-image.tsx`
- If the task is about locale or Chinese/English switching:
  - start with `components/providers/locale-provider.tsx`
  - then `lib/i18n/messages.ts`
  - then `lib/content/data.ts`
