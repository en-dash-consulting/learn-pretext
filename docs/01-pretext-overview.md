# Pretext: Deep Technical Overview

## What It Is

**Pretext** (`@chenglou/pretext`) is a pure JavaScript/TypeScript library for **multiline text measurement and layout without DOM reflow**. Created by Cheng Lou (@chenglou), engineer at Midjourney and creator of react-motion, core contributor to React and ReasonML.

- **Repo**: https://github.com/chenglou/pretext
- **npm**: `@chenglou/pretext`
- **Size**: ~15KB, zero dependencies, ESM-only
- **License**: MIT
- **Stars**: ~11,100 (as of March 2026)

## The Core Problem

When UI components independently measure text heights using DOM reads like `getBoundingClientRect()` or `offsetHeight`, each read forces **synchronous layout reflow**. If reads interleave with writes, the browser re-lays out the entire document repeatedly.

For 500 text blocks:
- DOM interleaved measurement: **30-43ms per frame**
- DOM batched measurement: **4-87ms per frame**

This makes smooth 60fps layouts with dynamic text essentially impossible through traditional DOM measurement.

## The Solution: Two-Phase Architecture

### Phase 1: `prepare(text, font)`
One-time work per text block:
- Normalize whitespace
- Segment text via `Intl.Segmenter`
- Apply language-specific glue rules
- Measure segments via canvas `measureText()`
- Cache widths
- ~19ms for 500 texts

### Phase 2: `layout(prepared, maxWidth, lineHeight)`
Pure arithmetic over cached widths:
- No canvas calls
- No DOM reads
- No string operations
- No allocations
- ~0.09ms for 500 texts (**~0.0002ms per text block**)

`layout()` is the hot path — called on every resize, container change, animation frame, etc.

## Philosophy

From Cheng Lou's `thoughts.md`:

> "80% of CSS spec could be avoided if userland had better control over text. The paradigm of web layout shoves our text into a single-direction black hole, and to crawl those text metrics back incurs huge maintenance and performance overhead."

The goal: empower developers to create expressive layouts without waiting for web standards committees.

## What It Enables That CSS Cannot

- **Virtualization without guesstimates** — know exact heights before rendering
- **Masonry layouts** — predict card heights without DOM reads
- **Text flowing around arbitrary obstacles** — variable-width line-by-line layout
- **Shrink-wrap measurement** — tightest container width for text
- **Balanced text** — equal line widths across a paragraph
- **60fps editorial layouts** — reflow text every frame with near-zero cost
- **Canvas/WebGL/WebGPU text** — layout computation outside the DOM entirely
- **Development-time verification** — check label fit without a browser

## How It Differs From Everything Else

| Tool | Category | Relationship to Pretext |
|------|----------|------------------------|
| Tailwind / CSS Modules | CSS authoring | Completely different domain |
| styled-components | CSS-in-JS | Completely different domain |
| DOM measurement | Browser API | Direct replacement — 300-600x faster |
| Skia-wasm | Full rendering engine | Heavyweight alternative |
| CSS Exclusions/Regions | W3C specs | Similar goals but no browser implementation |
| Yoga (Facebook) | Flexbox engine | Complementary — Textura combines both |
| leeoniya's uWrap.js | ASCII text layout | Faster for ASCII-only, no i18n support |

## Accuracy

**7,680 / 7,680** test configurations pass across Chrome, Safari, and Firefox.

Test corpus: 4 fonts × 8 sizes × 8 widths × 30 texts = 7,680 configurations.

## Performance Benchmarks

| Operation | Chrome | Safari |
|-----------|--------|--------|
| `prepare()` (500 texts) | 18.85ms | 18.00ms |
| `layout()` (500 texts) | 0.09ms | 0.12ms |
| DOM batch measurement | 4.05ms | 87.00ms |
| DOM interleaved | 43.50ms | 149.00ms |

`layout()` is **~480x faster** than DOM interleaved on Chrome and **~1240x faster** on Safari.
