# Content Workflow

`blog`, `notes`, and `projects` are file-based MDX content collections.

## Where to add content

- Chinese blog posts: `content/zh/blog/*.mdx`
- English blog posts: `content/en/blog/*.mdx`
- Chinese notes: `content/zh/notes/*.mdx`
- English notes: `content/en/notes/*.mdx`
- Chinese projects: `content/zh/projects/*.mdx`
- English projects: `content/en/projects/*.mdx`

## Metadata format

Each file should export a `meta` object at the top.

### Blog post

```mdx
export const meta = {
  title: "Post title",
  slug: "post-slug",
  category: "Technical writing",
  date: "2026-06-12",
  readingTime: "5 min read",
  excerpt: "Short summary.",
  tags: ["Tag A", "Tag B"],
  draft: false,
  locale: "en",
}
```

### Note

```mdx
export const meta = {
  title: "Note title",
  slug: "note-slug",
  series: "Research Notes",
  date: "2026-06-12",
  summary: "Short summary.",
  tags: ["Tag A", "Tag B"],
  draft: false,
  locale: "en",
}
```

### Project

```mdx
export const meta = {
  title: "Project title",
  slug: "project-slug",
  period: "2026",
  category: "Research project",
  status: "In progress",
  role: "System design",
  summary: "Short summary.",
  tags: ["LLM", "Robotics"],
  links: [{ href: "#", label: "Code" }],
  draft: false,
  locale: "en",
}
```

Project pages now use a lighter structure:

- Keep meta small: title, slug, period, category, status, summary, tags, and optional role or links.
- Write the real project archive in the MDX body with headings like `## Background and problem`, `## Goal`, `## Method and implementation`, and `## Reflection and next steps`.
- This makes project editing closer to writing one normal article instead of maintaining a large structured form.

## New workflow

1. Add a new `.mdx` file to the correct content directory.
2. Run `pnpm content:generate`.
3. Start the site with `pnpm dev` or build with `pnpm build`.

Starter templates are available in:

- `content/templates/blog-template.mdx`
- `content/templates/note-template.mdx`
- `content/templates/project-template.mdx`

The generated index lives at `lib/content/generated-content-index.ts`.

You should not edit that generated file manually.

If a `meta` field is missing or malformed, `pnpm content:generate`, `pnpm dev`, and `pnpm build` will fail early and point to the problematic file.

The generator also checks for duplicate `slug` values within the same `locale + section`.

## Drafts

If `draft: true`, the item stays out of the public lists and detail lookups.

## Why this is better

The site no longer depends on hand-written imports inside `lib/content/mdx-content.ts`.

New content is picked up from the directory structure automatically after regeneration.
