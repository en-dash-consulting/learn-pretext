# Learn Pretext — Implementation Plan

## Tech Stack

### Core
- **Framework**: Vanilla TypeScript + Vite (MPA mode)
  - Vite multi-page app: each page is its own HTML entry point
  - Pretext is framework-agnostic — vanilla TS keeps focus on the library
  - Fast HMR, native ESM, minimal config
- **Pretext**: `@chenglou/pretext` (npm)
- **Styling**: Vanilla CSS with custom properties
  - CSS custom properties for theming (dark mode, typography scale)
  - No CSS framework — this site is about text layout
- **Code highlighting**: Shiki (static, beautiful syntax highlighting)
- **Routing**: File-based via Vite MPA — no client-side router needed

### Build & Tooling
- **Bundler**: Vite (MPA mode with `build.rollupOptions.input`)
- **TypeScript**: Strict mode
- **Linting**: oxlint
- **Formatting**: Prettier

### Deployment
- Static site — Vercel, Netlify, or GitHub Pages
- No SSR, no API

---

## Project Structure

```
ts-css/
├── index.html                          # Landing page
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/                               # Research & planning docs
├── public/
│   └── fonts/                          # Self-hosted Inter, JetBrains Mono
│
├── pages/                              # One HTML file per page
│   ├── why-pretext.html
│   ├── getting-started.html
│   ├── accordion.html
│   ├── bubbles.html
│   ├── masonry.html
│   ├── balanced-text.html
│   ├── pipeline.html
│   ├── rich-api.html
│   ├── editorial.html
│   ├── virtualized.html
│   ├── canvas.html
│   ├── i18n.html
│   ├── kinetic.html
│   ├── ascii-art.html
│   ├── api-reference.html
│   ├── performance.html
│   └── caveats.html
│
├── src/
│   ├── shared/                         # Shared across all pages
│   │   ├── styles/
│   │   │   ├── reset.css
│   │   │   ├── variables.css           # Colors, type scale, spacing
│   │   │   ├── global.css              # Typography, dark theme
│   │   │   ├── layout.css              # Shell: header, sidebar, footer, content
│   │   │   └── components.css          # Source viewer, perf meter, controls
│   │   ├── shell.ts                    # Header, sidebar nav, footer — injected on every page
│   │   ├── code-highlight.ts           # Shiki setup
│   │   ├── nav-data.ts                 # Page tree structure (tracks, pages, order)
│   │   └── pretext-helpers.ts          # Thin common patterns (font loading, resize, etc.)
│   │
│   ├── components/                     # Reusable interactive components
│   │   ├── source-viewer.ts            # Annotated source code panel
│   │   ├── performance-meter.ts        # Live timing display
│   │   ├── slider.ts                   # Range slider with label
│   │   ├── toggle.ts                   # On/off toggle
│   │   ├── demo-container.ts           # Wrapper: demo + source + explanation
│   │   └── page-nav.ts                # ← Previous / Next → links
│   │
│   └── pages/                          # Page-specific entry points
│       ├── home.ts                     # Landing page logic
│       ├── why-pretext.ts
│       ├── getting-started.ts
│       ├── accordion.ts
│       ├── bubbles.ts
│       ├── masonry.ts
│       ├── balanced-text.ts
│       ├── pipeline.ts
│       ├── rich-api.ts
│       ├── editorial.ts
│       ├── virtualized.ts
│       ├── canvas.ts
│       ├── i18n.ts
│       ├── kinetic.ts
│       ├── ascii-art.ts
│       ├── api-reference.ts
│       ├── performance.ts
│       └── caveats.ts
```

---

## Implementation Phases

### Phase 0: Scaffold
- Initialize package.json (Vite + TypeScript)
- Install deps: `@chenglou/pretext`, `vite`, `typescript`, `shiki`
- Configure Vite MPA with all page entries
- tsconfig.json (strict)
- CSS architecture: reset, variables, global, layout
- Self-host Inter + JetBrains Mono
- Verify pretext imports work

### Phase 1: Shell & Navigation
- Header component: "Learn Pretext" wordmark, responsive
- Sidebar nav: full page tree grouped by track, active page highlighted
- Footer: "Built by En Dash" · "Built with n-dx and Claude" · GitHub/npm links
- ← Previous / Next → page navigation
- Mobile: hamburger menu for sidebar
- shell.ts injected on every page via shared entry

### Phase 2: Shared Components
- Source viewer (Shiki highlighting, line numbers, copy button, annotation highlights)
- Performance meter (live timing display)
- Demo container (demo + explanation + source in consistent layout)
- Slider, toggle, page-nav components

### Phase 3: Foundations Track (Pages 1–3)
- Home / landing with hero animation
- "Why Pretext" with interactive perf comparison
- "Getting Started" with interactive prepare/layout sandbox

### Phase 4: Core Patterns Track (Pages 4–8)
- Accordion (height prediction)
- Chat Bubbles (shrink-wrap)
- Masonry (card grid)
- Balanced Text
- Pipeline deep dive

### Phase 5: Advanced Track (Pages 9–13)
- Rich API overview
- Editorial layout (variable-width flow)
- Virtualized list (10K+ items)
- Canvas rendering
- i18n deep dive

### Phase 6: Creative Track (Pages 14–15)
- Kinetic typography
- ASCII art & fluid text

### Phase 7: Reference Track (Pages 16–18)
- API reference with interactive try-it blocks
- Performance guide
- Caveats & recipes

### Phase 8: Polish
- Cross-browser testing (Chrome, Safari, Firefox)
- Responsive testing (320px → 2560px)
- Accessibility audit (keyboard, screen reader, contrast)
- Performance audit
- Font loading states
- SEO meta tags + Open Graph

---

## Vite MPA Config Pattern

```ts
// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'why-pretext': resolve(__dirname, 'pages/why-pretext.html'),
        'getting-started': resolve(__dirname, 'pages/getting-started.html'),
        accordion: resolve(__dirname, 'pages/accordion.html'),
        // ... all pages
      },
    },
  },
})
```

---

## Page Entry Pattern

Each page HTML:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accordion — Learn Pretext</title>
  <link rel="stylesheet" href="/src/shared/styles/reset.css" />
  <link rel="stylesheet" href="/src/shared/styles/variables.css" />
  <link rel="stylesheet" href="/src/shared/styles/global.css" />
  <link rel="stylesheet" href="/src/shared/styles/layout.css" />
  <link rel="stylesheet" href="/src/shared/styles/components.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/shared/shell.ts"></script>
  <script type="module" src="/src/pages/accordion.ts"></script>
</body>
</html>
```

Each page TS:
```ts
// src/pages/accordion.ts
import { prepare, layout } from '@chenglou/pretext'
import { createDemoContainer } from '../components/demo-container'
import { createSourceViewer } from '../components/source-viewer'

const content = document.querySelector('#content')!

// 1. Build the interactive demo
// 2. Build the explanation
// 3. Build the source viewer
// 4. Wire up interactions
```

---

## Dependencies

### Production
- `@chenglou/pretext`

### Dev
- `vite`
- `typescript`
- `shiki`

### Fonts (self-hosted)
- Inter (body text — matches pretext's test corpus)
- JetBrains Mono (code blocks)

---

## Performance Budget
- Per-page first paint: < 800ms
- Per-page interactive: < 1.5s
- Per-page bundle: < 50KB (excluding shared + fonts)
- Shared bundle: < 60KB
- All demos 60fps during interaction

---

## Browser Support
- Chrome 94+
- Safari 17.4+
- Firefox 125+
