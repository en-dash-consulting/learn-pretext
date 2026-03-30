# Project Context

## What this is

Learn Pretext is an interactive learning site for the pretext library (@chenglou/pretext). It's a Vite multi-page app (MPA) written in vanilla TypeScript — no React, no framework. Each page is a standalone HTML entry that loads a shared shell (header, sidebar, footer) and a page-specific script.

This is a free community resource created by [En Dash Consulting](https://endash.us), whose mission is to **Make Work Feel Better**. Building open educational tools like this is part of how En Dash invests in the developer community, alongside consulting directly with clients on Ways of Working Transformations and product/software engineering.

## Architecture

### Page lifecycle
1. Browser loads `pages/foo.html` (or `index.html` for home)
2. `src/shared/shell.ts` runs first: imports CSS + fonts, builds the full page shell into `#app`, creates `#page-content` div
3. `src/pages/foo.ts` runs second: gets `#page-content`, calls `waitForFonts()`, builds interactive demo

### Navigation
`src/shared/nav-data.ts` defines the full page tree (5 tracks, 20 pages). All hrefs are base-aware via `import.meta.env.BASE_URL`. Shell reads this for sidebar, header nav, and prev/next links.

### Shared components
- `src/components/search.ts` — Cmd+K search modal with fuzzy matching
- `src/components/source-viewer.ts` — Shiki-highlighted code with copy button
- `src/components/performance-meter.ts` — live timing display
- `src/components/slider.ts` — range input with label
- `src/components/toggle.ts` — accessible toggle switch

### CSS architecture
5 files loaded in order: reset, variables, global, layout, components. All theming via CSS custom properties. Dark theme with indigo accent.

### Pretext usage
Every demo page imports directly from `@chenglou/pretext`. The `src/shared/pretext-helpers.ts` module provides thin wrappers (font constants, timing, resize observer). All `prepare()` calls happen after `document.fonts.ready`.

## Key decisions

- **Vanilla TS, not React** — keeps focus on the library, not a framework. Each page is self-contained.
- **Vite MPA** — each page is a separate HTML entry. No client-side router. Pages share CSS + shell via common imports.
- **Real pretext calls** — every demo uses the actual library. Nothing is mocked or simulated.
- **Source visible** — every demo has a Shiki source viewer showing the implementation.
- **Independent from pretext author** — this is by En Dash, not Cheng Lou. Attribution is clear on the home page, about page, and footer.

## Deployment

GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`). Custom domain: learn-pretext.com (CNAME in `public/`). Google Analytics: G-7GPK6JVHS2.

## Testing

Vitest with jsdom. Tests in `src/**/*.test.ts`. Currently covers nav-data and pretext-helpers.

## Important files

- `src/shared/shell.ts` — the global page shell
- `src/shared/nav-data.ts` — page tree and routing
- `src/shared/styles/variables.css` — all design tokens
- `vite.config.ts` — MPA entry points
- `.github/workflows/deploy.yml` — CI/CD
