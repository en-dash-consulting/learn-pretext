# Learn Pretext

An interactive learning site for [@chenglou/pretext](https://github.com/chenglou/pretext) — a JavaScript library for multiline text measurement and layout without DOM reflow.

**Live site:** [learn-pretext.com](https://learn-pretext.com)

## What is pretext?

Pretext is a pure JS/TS library by [Cheng Lou](https://github.com/chenglou) that measures and lays out multiline text using arithmetic over cached glyph widths — no DOM reads, no layout thrashing, ~300x faster than `getBoundingClientRect()`.

This site is an **independent community resource** by [En Dash](https://endash.us). It is not affiliated with or endorsed by the pretext author.

## What's on the site

20 interactive pages across 5 learning tracks:

| Track | Pages | What you'll learn |
|-------|-------|-------------------|
| **Foundations** | Home, Why Pretext, Getting Started | What pretext is, layout thrashing, first `prepare()` + `layout()` |
| **Core Patterns** | Accordion, Chat Bubbles, Masonry, Balanced Text, Pipeline | Height prediction, shrink-wrap, card grids, binary search, `prepare()` internals |
| **Advanced** | Rich API, Editorial Layout, Virtualized Lists, Canvas, i18n | `layoutNextLine()` obstacle avoidance, 10K virtual scroll, canvas text, CJK/RTL/emoji |
| **Creative** | Kinetic Typography, ASCII Art | Character-level animation, proportional ASCII rendering |
| **Reference** | API Reference, Performance Guide, Caveats, Accessibility, About | Full API docs, benchmarks, recipes, a11y patterns |

Every demo is live and interactive. Every demo includes annotated source code showing exactly how it's implemented.

## Development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # Production build to dist/
npm run test     # Run tests
npm run preview  # Preview production build
```

### Tech stack

- **Vanilla TypeScript** + **Vite** (MPA mode, no framework)
- **@chenglou/pretext** for all text measurement
- **Shiki** for syntax highlighting in source viewers
- **Inter** + **JetBrains Mono** (self-hosted via fontsource)

### Project structure

```
index.html                    # Landing page
pages/*.html                  # One HTML entry per page
src/
  shared/
    shell.ts                  # Header, sidebar, footer (injected on every page)
    nav-data.ts               # Page tree, routing
    analytics.ts              # Google Analytics
    styles/                   # CSS architecture (variables, global, layout, components)
  components/
    search.ts                 # Cmd+K search modal
    source-viewer.ts          # Shiki code viewer
    performance-meter.ts      # Live timing display
    slider.ts, toggle.ts      # Interactive controls
  pages/
    home.ts ... about.ts      # Page-specific logic
```

## Deployment

Deployed to GitHub Pages via GitHub Actions on push to `main`. Custom domain: `learn-pretext.com`.

## Built with

- [pretext](https://github.com/chenglou/pretext) by Cheng Lou
- [n-dx](https://n-dx.dev) for product development
- [Claude](https://claude.ai) via Claude Code

Built by [En Dash](https://endash.us).
