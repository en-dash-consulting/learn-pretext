# Learn Pretext

An interactive learning site for [@chenglou/pretext](https://github.com/chenglou/pretext) — a JavaScript library for multiline text measurement and layout without DOM reflow.

**Live site:** [learn-pretext.com](https://learn-pretext.com)

## What is pretext?

Pretext is a pure JS/TS library by [Cheng Lou](https://github.com/chenglou) that measures and lays out multiline text using arithmetic over cached glyph widths — no DOM reads, no layout thrashing, ~300x faster than `getBoundingClientRect()`.

This site is an **independent community resource** by [En Dash Consulting](https://endash.us). It is not affiliated with or endorsed by the pretext author.

## What's on the site

26 interactive pages across 5 learning tracks:

| Track | Pages | What you'll learn |
|-------|-------|-------------------|
| **Foundations** | Home, Why Pretext, Getting Started | What pretext is, layout thrashing, first `prepare()` + `layout()` |
| **Core Patterns** | Accordion, Chat Bubbles, Masonry, Balanced Text, Pipeline | Height prediction, shrink-wrap, card grids, binary search, `prepare()` internals |
| **Advanced** | Rich API, Editorial Layout, Virtualized Lists, Canvas, i18n | `layoutNextLine()` obstacle avoidance, 10K virtual scroll, canvas text, CJK/RTL/emoji |
| **Creative** | Kinetic Typography, ASCII Art, Text Physics, ASCII Tanks, Text Rain, Text Tetris, Breaking Spaces | Character-level animation, proportional ASCII rendering, physics simulation, text games |
| **Reference** | API Reference, Performance Guide, Caveats & Recipes, Accessibility, About | Full API docs, benchmarks, recipes, a11y patterns |

The homepage features an interactive canvas-rendered newspaper ("The Pretext Times") where you can drag procedurally-drawn images onto a multi-column layout and watch text reflow around them in real-time at 60fps.

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
index.html                    # Landing page (interactive newspaper editor)
pages/*.html                  # One HTML entry per page (25 pages)
public/
  favicon.svg                 # SVG favicon (En Dash branding)
  favicon.ico                 # ICO favicon
  apple-touch-icon.png        # Apple touch icon
  og-image.png                # Open Graph social image
  robots.txt                  # Search engine crawling rules
  sitemap.xml                 # XML sitemap for search engines
  CNAME                       # Custom domain config
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
    home.ts ... about.ts      # Page-specific logic (26 files)
docs/                         # Research and planning documents
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Deployment

Deployed to GitHub Pages via GitHub Actions on push to `main`. Custom domain: `learn-pretext.com`.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Built with

- [pretext](https://github.com/chenglou/pretext) by Cheng Lou
- [n-dx](https://n-dx.dev) for product development
- [Claude](https://claude.ai) via Claude Code

## About En Dash Consulting

[En Dash Consulting](https://endash.us) is on a mission to **Make Work Feel Better**. We do that by creating free resources like this site, and by working directly with clients on Ways of Working Transformations and product/software engineering. Learn more at [endash.us](https://endash.us).
