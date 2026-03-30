# Learn Pretext — Requirements

## Epic 1: Site Shell & Infrastructure

### E1.1: Project Scaffold
- Vite MPA project with TypeScript strict mode
- `@chenglou/pretext`, `vite`, `typescript`, `shiki` installed
- Vite config with multi-page input entries (18 pages)
- CSS architecture: reset, variables, global, layout, components
- Self-hosted Inter (body) and JetBrains Mono (code) fonts
- Verify pretext prepare/layout works in dev environment

### E1.2: Global Header
- "Learn Pretext" text/wordmark, left-aligned
- Navigation links to track landing pages
- Responsive: collapses to hamburger on mobile
- Sticky on scroll
- Current page/track indicator

### E1.3: Sidebar Navigation
- Full page tree grouped by track (Foundations, Core Patterns, Advanced, Creative, Reference)
- Track headings with expandable page lists
- Active page highlighted
- Scrollable independently of content
- Desktop: always visible, 240px wide
- Mobile: slide-out drawer triggered by hamburger

### E1.4: Footer
- "Built by En Dash" (left or center)
- "Built with n-dx and Claude" (left or center)
- Links: GitHub repo, npm package, Cheng Lou's site
- Consistent on every page

### E1.5: Page Navigation
- ← Previous / Next → links at bottom of every content page
- Shows page title for context ("← Why Pretext" / "Accordion →")
- Follows the linear progression order across tracks

### E1.6: Shared Components
- **Source Viewer**: Shiki-highlighted TypeScript, line numbers, copy button, annotation highlights for key API calls, collapsible on mobile
- **Performance Meter**: real-time `performance.now()` display, shows prepare/layout/DOM timings, bar or numeric format
- **Demo Container**: consistent wrapper — interactive demo area + explanation prose + source viewer
- **Slider**: range input with live value label
- **Toggle**: on/off switch with label

---

## Epic 2: Foundations Track (3 pages)

### E2.1: Home / Landing
- Hero section with live text reflow animation (pretext-powered)
- Tagline: "Text layout at the speed of arithmetic"
- One-paragraph description of what pretext is
- Live performance counter: pretext layout() timing vs DOM measurement
- "Start Learning" CTA → Why Pretext page
- Quick-jump links to all 5 tracks for returning visitors
- Font loading gate: content appears after Inter font ready

### E2.2: Why Pretext — The Problem
- Explanation: what is layout thrashing, why does it happen
- Animated visual timeline: DOM reads interleaved with writes, reflow bars
- Interactive comparison: 100+ text blocks measured via DOM (interleaved) vs pretext
- Toggle between approaches — feel the frame drops vs smooth 60fps
- Side-by-side ms/frame display
- "What CSS can't do" section: obstacle avoidance, true shrink-wrap, virtualization, balanced text
- Next → Getting Started

### E2.3: Getting Started
- Install commands: npm, bun, yarn
- First working example in ≤10 lines with live result
- Two-phase mental model explained: prepare once, layout many
- Interactive sandbox: user types text, picks font, drags width slider → live lineCount + height
- Font loading caveat explained with code
- Next → Accordion (first core pattern)

---

## Epic 3: Core Patterns Track (5 pages)

### E3.1: Accordion — Height Prediction
- **API**: `prepare()` + `layout()`
- Demo: ≥5 expandable sections with varied text lengths
- Smooth CSS height transition (prepare before animate)
- "Without pretext" toggle: DOM measurement version with visible jank
- Annotated source: prepare on mount, layout for height calc
- User can edit accordion content text and see heights recalculate

### E3.2: Chat Bubbles — Shrink-Wrap
- **API**: `walkLineRanges()`
- Demo: chat UI with ≥20 pre-populated messages
- User can type and send new messages
- Each bubble = tightest shrink-wrap width
- Side-by-side: CSS `fit-content` vs pretext optimal width
- Pixel savings displayed per bubble
- Annotated source

### E3.3: Masonry — Card Grid
- **API**: `prepare()` + `layout()` at scale
- Demo: 50+ cards with variable text content
- Heights predicted via pretext, placed in shortest column
- Responsive: 1–4 columns based on viewport
- Smooth re-layout on resize (no DOM measurement)
- Annotated source

### E3.4: Balanced Text
- **API**: `walkLineRanges()` (binary search)
- Demo: paragraph with "Normal" vs "Balanced" toggle
- Binary search for optimal width → all lines ~equal
- Visual diff between modes
- Annotated source showing the binary search algorithm

### E3.5: The Pipeline — prepare() Deep Dive
- Interactive visualization: raw text → normalize → segment → merge/glue → measure → cache
- User types custom text, sees segments highlighted by break kind (8 colors)
- Width cache visualization: hits/misses across multiple prepare calls
- Timing breakdown per pipeline stage
- Explains: prepare is ~19ms/500, layout is ~0.09ms/500

---

## Epic 4: Advanced Track (5 pages)

### E4.1: Rich API Overview
- When to use rich API vs fast path (decision guide)
- `prepareWithSegments()`: what it returns (segments, widths, kinds, bidi levels)
- `layoutWithLines()` vs `layout()`: when you need line objects
- `layoutNextLine()`: the iterator pattern
- Interactive: same text through all APIs, showing outputs side by side

### E4.2: Editorial Layout — Variable-Width Flow
- **API**: `layoutNextLine()` in depth
- Demo: magazine spread with ≥2 draggable obstacle elements
- Text flows around obstacles using per-line variable widths
- 60fps during obstacle drag
- Multi-column flow
- Annotated source

### E4.3: Virtualized Lists
- **API**: `prepare()` + `layout()` for 10K+ items
- Demo: 10,000+ items with variable text lengths
- Virtual scroll: only visible items rendered
- Total scroll height from pretext (no DOM measurement)
- Scroll position accurate within 1px
- FPS counter during fast scroll
- Annotated source

### E4.4: Canvas Rendering — Beyond the DOM
- **API**: `prepareWithSegments()` + `layoutWithLines()` + `ctx.fillText()`
- Demo: canvas with multiline wrapped text
- Pan (drag) and zoom (scroll wheel)
- Text re-wraps at each zoom level
- Annotated source

### E4.5: i18n Deep Dive
- **API**: `setLocale()`, segmentation across scripts
- Language selector: English, Chinese, Japanese, Arabic, Thai, Hindi, Myanmar, emoji
- CJK kinsoku rules visualized (prohibited chars highlighted)
- Bidi text: mixed LTR/RTL
- Emoji: ZWJ sequences, width correction
- User can paste any text → see segments + measurement
- Annotated source

---

## Epic 5: Creative Track (2 pages)

### E5.1: Kinetic Typography
- Multiple sub-demos: particle text, shaped text (calligrams), flowing text
- Uses per-segment/per-grapheme measurement data
- Animated at 60fps
- Source for each sub-demo

### E5.2: ASCII Art & Fluid Text
- Variable-width proportional ASCII rendering
- Fluid simulation as typographic characters
- 3D wireframe through a character grid
- Source for each

---

## Epic 6: Reference Track (3 pages)

### E6.1: API Reference
- Every function documented: signature, parameters, return type, description
- Interactive "try it" code blocks for each API
- Cross-links to demo pages that use each API
- Types section with all exported types

### E6.2: Performance Guide
- Benchmark table: prepare vs layout vs DOM (Chrome/Safari)
- When to call prepare vs layout
- Caching strategy: what's cached, when to `clearCache()`
- Browser engine profiles explained
- Performance measurement code patterns

### E6.3: Caveats & Recipes
- system-ui font bug (with explanation and fix)
- Font string matching rules
- CSS target limitations (white-space, word-break, overflow-wrap, line-break)
- pre-wrap mode
- Soft hyphens
- Recipes: resize handler, React integration, animation loop, font loading

---

## Epic 7: Non-Functional Requirements

### E7.1: Performance
- Per-page first paint: < 800ms
- Per-page interactive: < 1.5s
- Per-page JS bundle: < 50KB (excluding shared)
- Shared JS bundle: < 60KB
- All demos maintain 60fps during interaction
- Pretext layout() calls < 1ms on all demos

### E7.2: Accessibility
- All interactive elements keyboard-accessible
- ARIA labels on custom controls (sliders, toggles, nav)
- WCAG AA color contrast
- Screen reader navigable structure (landmarks, headings)
- No user-select: none or pointer-events: none on readable content
- Skip-to-content link

### E7.3: Responsive Design
- Mobile (320px) through ultrawide (2560px+)
- Sidebar collapses to drawer on mobile
- Demos adapt: may simplify on mobile (fewer items, stacked layout)
- Touch support for drag interactions
- No horizontal scroll on any page

### E7.4: Browser Support
- Chrome 94+, Safari 17.4+, Firefox 125+
- Graceful fallback if Intl.Segmenter unavailable

### E7.5: Code Quality
- Strict TypeScript, no `any`
- Each page self-contained and independently understandable
- Shared code in shared/, page code in pages/
- Consistent code style throughout

---

## Epic 8: Design System

### E8.1: Visual Theme
- Dark background (#0a0a0a – #1a1a1a)
- Light text, high contrast
- Accent color for interactive elements and highlights
- Inter for body, JetBrains Mono for code
- The site is itself a typography showcase

### E8.2: Typography Scale
- Sizes: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px
- Line heights: 1.2 headings, 1.5 body, 1.6 code
- Max reading width: 65ch for prose
- Generous whitespace between sections

### E8.3: Animation & Interaction
- Subtle CSS transitions for UI state changes
- requestAnimationFrame for pretext-driven animations
- Respect `prefers-reduced-motion`
- Visible focus indicators
- Hover states on all interactive elements
- Drag handles clearly indicated
- Sliders with live value labels
