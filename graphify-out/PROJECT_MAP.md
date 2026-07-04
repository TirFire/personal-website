# Project Map

This document is a compact AI-facing guide to the code graph built from `app/`, `components/`, and `lib/`.

## Scope

- This map is intentionally code-centric.
- It excludes `public/`, most content assets, and large image payloads.
- Use it as the first stop before reading the full codebase.

## Main Entry

- `app/layout.tsx`
  - Global shell for the whole site.
  - Wires `LocaleProvider`, `Header`, `Footer`, analytics, cursor effects, metadata base, and global CSS.
- `app/page.tsx`
  - Root home route.
  - Delegates actual UI to `components/pages/home-page.tsx`.
  - Uses `buildPageMetadata()` for route metadata.

## Route Layer

- `app/**/page.tsx`
  - Thin route wrappers.
  - Most routes only do two things:
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
  - These are the best files to inspect for page behavior, filtering, rendering structure, and user-facing logic.
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

The Studio pipeline is one of the most important subsystems in this project.

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

### Core runtime/content orchestration

- `lib/content/studio.ts`
  - Central Studio runtime router and CRUD layer.
  - Responsible for:
    - listing/editing MDX items
    - listing/editing structured JSON data
    - validating content
    - routing writes across local, GitHub, and read-only fallback modes
    - regenerating the content index for local filesystem mode
- `lib/content/studio-github.ts`
  - GitHub-backed Studio adapter.
  - Handles:
    - reading repo files through the GitHub Contents API
    - writing and deleting MDX / JSON / uploaded assets on the target branch
    - exposing repo / branch runtime info to the Studio UI
- `lib/content/generated-studio-index.ts`
  - Build-time fallback index for deployed read-only Studio mode.
  - Preserves generated `meta`, `body`, and `source` so deployed `/studio` can still inspect published content even without a writable backend.

### Studio runtime modes

- `filesystem`
  - Local development mode.
  - Directly reads and writes `content/` and `content/data/`.
- `github`
  - Cloud editing mode.
  - Writes Studio changes back to GitHub and relies on Vercel redeploys for public-site refresh.
- `readonly-bundled`
  - Safe deployed fallback.
  - Lets `/studio` inspect bundled content but blocks mutating actions.

### Parsing and import helpers

- `lib/content/studio-source.ts`
  - Parses exported `meta`
  - Normalizes imported markdown/obsidian-like content
  - Handles wiki-link/image/callout style adaptation
- `lib/content/studio-preview.tsx`
  - Preview rendering support
- `lib/content/mdx-options.mjs`
  - Shared MDX compile options

### Practical rule

- If a task mentions `/studio`, content editing, file import, Obsidian compatibility, or content regeneration:
  - inspect `components/pages/studio-page.tsx`
  - then `app/api/studio/*`
  - then `lib/content/studio.ts`
  - then `lib/content/studio-github.ts`
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
  - local filesystem writes, GitHub writes, validation, regeneration
- `Studio GitHub Backend`
  - remote MDX / JSON / asset persistence through GitHub
- `Studio Read-only Fallback`
  - bundled content inspection path for deployed environments without cloud writes
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
7. `lib/content/studio-github.ts`
8. `lib/content/studio-source.ts`
9. `lib/seo.ts`
10. The specific page component related to the task in `components/pages/*`

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
  - then `lib/content/studio-github.ts`
- If the task is about metadata, sharing cards, canonical URLs, sitemap, or OG:
  - start with `lib/seo.ts` and `lib/og-image.tsx`
- If the task is about locale or Chinese/English switching:
  - start with `components/providers/locale-provider.tsx`
  - then `lib/i18n/messages.ts`
  - then `lib/content/data.ts`
