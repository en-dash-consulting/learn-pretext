# Pretext: Existing Demos & Community Work

## Official Demos (chenglou.me/pretext)

### 1. Accordion
Expand/collapse sections with pretext-calculated heights. Classic use case: predict collapsed panel heights without DOM measurement. Calls `prepare()` once, then `layout()` on every toggle/resize.

### 2. Bubbles
Chat bubble shrink-wrap. Uses `walkLineRanges()` to find the tightest container width for each message, eliminating wasted whitespace.

### 3. Dynamic Layout
Fixed-height editorial spread with two-column text flow, obstacle avoidance around SVG logos, live reflow. Uses `layoutNextLine()` for variable-width line-by-line layout.

### 4. Variable Typographic ASCII
Text measurement for ASCII art with variable-width fonts. Particle-driven characters mapped by brightness and width.

### 5. Editorial Engine
Animated orbs, live text reflow, pull quotes, multi-column flow at 60fps with zero DOM measurements.

### 6. Rich Text
Rich inline text with code spans, links, and chips staying whole while text wraps.

### 7. Masonry
Text-card occlusion demo where height prediction comes from Pretext.

---

## Community Demos

### somnai-dreams/pretext-demos
**URL**: https://somnai-dreams.github.io/pretext-demos/ (5 stars)

1. **The Editorial Engine** — Multi-column editorial layout with draggable orbs and real-time text reflow at 60fps
2. **Fluid Smoke** — Full-screen fluid simulation rendered as proportional typographic ASCII
3. **Wireframe Torus** — Rotating 3D wireframe torus through a proportional character grid
4. **Variable Typographic ASCII** — Particles mapped to characters by brightness/width across 3 weights
5. **Calligram Engine** — Type a word and it renders as a shape using its own letters
6. **Shrinkwrap Showdown** — CSS fit-content vs Pretext for tightest multiline width

### Aiia Dragon Demo
**URL**: https://aiia.ro/pretext/index.html
80-segment dragon follows the cursor through text, reflowing every line in real time at 60fps.

### shuffle-article (Innei)
**URL**: https://shuffle-article.vercel.app (180 stars)
Shuffles text in the DOM while preserving visual rendering, using Pretext for character positioning.

### Infinite Canvas Tutorial (xiaoiver)
**URL**: https://infinitecanvas.cc/example/pretext (949 stars)
Text-baseline and max-lines/text-overflow with Pretext integration in a WebGL/WebGPU canvas.

### Weft (SeloSlav)
**URL**: https://pretext-weft.vercel.app
WebGPU project using typographic layout to drive gameplay-responsive instanced placement.

### Textura (razroo)
"Pretext × Yoga = Textura" — DOM-free layout engine combining text measurement with flexbox layout.

---

## Community Projects Using Pretext

| Project | Description | Stars |
|---------|-------------|-------|
| Innei/shuffle-article | Shuffle text preserving visual layout | 180 |
| xiaoiver/infinite-canvas-tutorial | Canvas tutorial with Pretext text rendering | 949 |
| razroo/textura | Pretext + Yoga DOM-free layout engine | 15 |
| CoWork-OS/CoWork-OS | Multi-channel AI agent OS | 181 |
| SeloSlav/weft | WebGPU reactive 3D surfaces | 1 |
| vertz-dev/vertz | Agent-native TypeScript stack | 28 |
| intergalacticspacehighway/pretext-react-native-example | React Native integration | 0 |

---

## Community Discussion Summary

### Excitement (HN, X, blogs)
- Simon Willison: "Very impressive" — praised testing methodology
- Linus Ekenstam: "This changes the internet at its core"
- Multiple users: solved long-standing pain points (datagrid sizing, subtitle generation, virtualized lists)
- Significant AI development story — built with Claude Code + Codex in iterative verification loop

### Criticism
- Accessibility concerns: `user-select: none`, `pointer-events: none` on demo content
- Mobile rendering issues on demo page at launch
- leeoniya (uPlot): simpler uWrap.js faster for ASCII-only (80ms vs 2200ms for 100K sentences)
- Some skepticism about "changes the internet" framing — most sites don't need this
- CSS Exclusions/Regions already addressed some use cases as W3C specs

### Consensus Use Cases
1. Virtualized lists and chat interfaces
2. Canvas/WebGL/WebGPU rendering (Figma/Miro-style)
3. Editorial/magazine layouts
4. Masonry layouts
5. Dynamic subtitle generation (Remotion)
6. Datagrid text measurement
7. SVG generation (server-side PDFs, certificates, social cards)
8. React Native text layout
9. Generative/kinetic typography
10. Dev-time label overflow verification
