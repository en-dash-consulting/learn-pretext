# Learn Pretext — Content & Structure Plan

## Site Concept

**"Learn Pretext"** — A multi-page, progressive learning site that teaches pretext through interactive, annotated demos. Each page builds on the last. Every demo is simultaneously a live experience and an instructional reference — the source code for what you're seeing is always visible and explained.

The site itself uses pretext for its own layout where appropriate, making it self-referential.

---

## Site Map & Learning Progression

### Global Shell
- **Header**: "Learn Pretext" wordmark/logo, navigation, current page indicator
- **Sidebar nav** (desktop) / **hamburger** (mobile): full page tree with progress/track indicators
- **Footer**: Links to GitHub/npm, "Built by En Dash", "Built with n-dx and Claude"

---

### Track 1: Foundations (Pages 1–3)
*For anyone new to pretext. Establishes what it is, why it matters, and how to start.*

#### Page 1: Home / Landing
- Hero with live text reflow animation
- "Text layout at the speed of arithmetic" tagline
- What pretext is in one paragraph
- Visual: pretext timing vs DOM timing (live counter)
- Call-to-action: "Start Learning" → Page 2
- Quick links to all tracks for returning visitors

#### Page 2: Why Pretext — The Problem
- What is layout thrashing? Animated visual timeline
- Interactive: 100+ text blocks measured via DOM (interleaved) — watch the frame drops
- Toggle to pretext measurement — smooth 60fps
- Side-by-side performance comparison (ms/frame)
- "What CSS can't do" — list of layouts that are impossible/impractical: obstacle avoidance, shrink-wrap, virtualization without guesstimates
- Leads to: "Now let's see how it works" → Page 3

#### Page 3: Getting Started
- Install: `npm install @chenglou/pretext`
- First example: 10-line prepare/layout with live result
- The two-phase mental model: prepare once, layout many
- Interactive: user types text, picks a font, drags a width slider → sees lineCount and height update in real-time
- Font loading caveat (wait for `document.fonts.ready`)
- Leads to: "Let's explore the core API" → Track 2

---

### Track 2: Core Patterns (Pages 4–8)
*One page per fundamental pattern. Each teaches one API + one real UI pattern.*

#### Page 4: Height Prediction — Accordion
**API focus**: `prepare()` + `layout()`

- Concept: predicting text block height without rendering
- Interactive demo: beautiful accordion with smooth height animations
- "Without pretext" toggle: same accordion using DOM measurement (visible jank on rapid toggle)
- Annotated source: `prepare()` on data load, `layout()` before each animation
- Key insight: `layout()` is pure arithmetic — sub-microsecond, no reflow
- Try it: user can edit accordion content and watch heights recalculate

#### Page 5: Shrink-Wrap — Chat Bubbles
**API focus**: `walkLineRanges()`

- Concept: finding the tightest container width for multiline text
- Interactive demo: iMessage-style chat with perfectly shrink-wrapped bubbles
- User can type and send new messages
- Visual comparison: CSS `fit-content` vs pretext optimal width (pixel savings shown per bubble)
- Annotated source: `walkLineRanges()` to find max line width
- Key insight: CSS has no built-in shrink-wrap for multiline text

#### Page 6: Masonry — Card Grid
**API focus**: `prepare()` + `layout()` at scale

- Concept: predicting heights for layout algorithms that need them upfront
- Interactive demo: Pinterest-style masonry with 50+ text-heavy cards
- Resize viewport → instant re-layout (no DOM measurement needed)
- Responsive: 1–4 columns based on width
- Annotated source: prepare all cards, layout for column width, assign to shortest column
- Key insight: masonry needs all heights before first paint — pretext makes this cheap

#### Page 7: Balanced Text
**API focus**: `walkLineRanges()` (binary search pattern)

- Concept: adjusting container width so all lines are approximately equal
- Interactive demo: paragraph with "Normal" vs "Balanced" toggle
- Visual diff showing the width optimization
- Annotated source: binary search over widths using `walkLineRanges()` as the test function
- Key insight: walkLineRanges is non-materializing — no strings built, just geometry

#### Page 8: The prepare/layout Pipeline
**API focus**: deep dive into what `prepare()` actually does

- Interactive visualization of the full pipeline:
  - Raw text → normalization → segmentation → merging/glue rules → measurement → cached widths
- User types custom text, sees segments highlighted by break kind (8 colors)
- Width cache visualization: show cache hits/misses across multiple prepare calls
- Timing breakdown: how much time each pipeline stage takes
- Key insight: prepare is the expensive part (~19ms/500), layout is nearly free (~0.09ms/500)

---

### Track 3: Advanced Techniques (Pages 9–13)
*Rich API, complex layouts, performance at scale. For developers building real products.*

#### Page 9: Rich API Overview
**API focus**: `prepareWithSegments()`, `layoutWithLines()`, `layoutNextLine()`

- When to use the rich API vs the fast path
- What `PreparedTextWithSegments` gives you: segments, widths, kinds, bidi levels
- `layoutWithLines()` vs `layout()` — when you need line objects, not just height
- `layoutNextLine()` — the iterator pattern for variable-width
- Interactive: same text through all three APIs, showing what each returns

#### Page 10: Editorial Layout — Variable-Width Flow
**API focus**: `layoutNextLine()` in depth

- Concept: text flowing around arbitrary obstacles, line by line
- Interactive demo: magazine spread with draggable images/shapes
- Text reflows at 60fps during drag
- Multi-column flow with cross-column obstacles
- Annotated source: layoutNextLine() in a loop with per-line width calculation
- Key insight: this is impossible in CSS — CSS Exclusions/Regions were never implemented

#### Page 11: Virtualized Lists
**API focus**: `prepare()` + `layout()` for 10K+ items

- Concept: virtual scroll with perfect height predictions
- Interactive demo: 10,000+ items, instant smooth scroll
- Total scroll height computed upfront via pretext
- FPS counter showing sustained 60fps during fast scroll
- Annotated source: prepare all texts once, layout for viewport width, sum for total height
- Key insight: virtual scrollers usually guess heights — pretext eliminates the guess

#### Page 12: Canvas Rendering — Beyond the DOM
**API focus**: `prepareWithSegments()` + `layoutWithLines()` + canvas `fillText()`

- Concept: rendering text entirely on canvas with proper wrapping
- Interactive demo: canvas with multiline text, pan and zoom
- Text re-wraps at each zoom level using pretext
- Annotated source: layout → iterate lines → fillText per line
- Key insight: pretext + canvas = Figma/Miro-style text without the DOM

#### Page 13: i18n Deep Dive
**API focus**: `setLocale()`, segmentation behavior across scripts

- Interactive language showcase: English, Chinese, Japanese, Arabic, Thai, Hindi, Myanmar, emoji
- CJK kinsoku rules visualized (prohibited line-start/end characters highlighted)
- Bidi text: mixed LTR/RTL rendered correctly
- Emoji handling: ZWJ sequences, width correction
- User can paste any text and see how pretext segments and measures it
- Annotated source: setLocale, prepare with different scripts

---

### Track 4: Creative (Pages 14–15)
*Pushing pretext beyond utility into expression.*

#### Page 14: Kinetic Typography
- Particles mapped to characters by brightness and width
- Text shaped into forms (calligrams)
- Generative typographic art using per-segment measurement
- Multiple sub-demos on one page
- Source for each

#### Page 15: ASCII Art & Fluid Text
- Variable-width proportional ASCII rendering
- Fluid simulation rendered as typographic characters
- 3D wireframe through a character grid
- Creative coding inspiration

---

### Track 5: Reference (Pages 16–18)
*Comprehensive reference material.*

#### Page 16: API Reference
- Every function, type, and option documented
- Interactive "try it" blocks for each API
- Cross-links to the demo pages that use each API

#### Page 17: Performance Guide
- Benchmarks: prepare vs layout vs DOM
- When to prepare: font loading, data changes
- Caching strategy: what's cached, when to clearCache()
- Browser engine profiles and their implications
- Performance measurement patterns

#### Page 18: Caveats & Recipes
- system-ui font bug
- Font string matching
- CSS target limitations (white-space, word-break, overflow-wrap, line-break)
- pre-wrap mode
- Soft hyphens
- Common recipes: resize handler, React integration, animation loop

---

## Page Template Structure

Every page follows a consistent layout:

```
┌─────────────────────────────────────────────┐
│  Learn Pretext          [nav] [nav] [nav]   │  ← Header
├──────────┬──────────────────────────────────┤
│          │                                  │
│  Sidebar │  Page Title                      │
│  Nav     │  Brief intro (2-3 sentences)     │
│          │                                  │
│  Track 1 │  ┌─ Interactive Demo ──────────┐ │
│  · Home  │  │                             │ │
│  · Why   │  │  (live, touchable)          │ │
│  · Start │  │                             │ │
│          │  └─────────────────────────────┘ │
│  Track 2 │                                  │
│  · Accor │  Explanation                     │
│  · Bubbl │  (concept, what's happening)     │
│  · Mason │                                  │
│  · Balan │  ┌─ Source Code ───────────────┐ │
│  · Pipel │  │  // annotated, highlighted  │ │
│          │  │  const p = prepare(text, f) │ │
│  ...     │  │  const { height } = layout… │ │
│          │  └─────────────────────────────┘ │
│          │                                  │
│          │  ← Previous    Next →            │
├──────────┴──────────────────────────────────┤
│  Built by En Dash · Built with n-dx & Claude│  ← Footer
└─────────────────────────────────────────────┘
```

---

## Design Principles

1. **Multi-page with clear progression** — each page teaches one thing well
2. **Interactive everything** — every concept has a live, touchable demo
3. **Source always visible** — annotated implementation code on every demo page
4. **Progressive complexity** — foundations → patterns → advanced → creative → reference
5. **Self-referential** — uses pretext for its own layout where it makes sense
6. **Beautiful typography** — the site itself is a typography showcase
7. **Navigable** — sidebar nav shows full structure, tracks, and current position
8. **Prev/Next flow** — natural linear progression through pages

## Content Tone
- Technical but approachable
- Teaching voice — "here's what's happening" not "here's the API"
- Show, don't tell — interactions are primary, prose is supporting
- Each page builds on the last but can stand alone
