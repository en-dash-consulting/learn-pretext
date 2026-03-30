# Pretext: Complete API Reference

## Core API (Fast Path)

### `prepare(text, font, options?)`
One-time measurement pass. Returns an opaque `PreparedText` handle.

```ts
import { prepare } from '@chenglou/pretext'

const prepared = prepare('AGI spring has arrived!', '16px Inter')
```

**Parameters:**
- `text: string` — the text to measure
- `font: string` — CSS font shorthand (e.g. `'16px Inter'`, `'bold 14px "Helvetica Neue"'`)
- `options?: { whiteSpace: 'normal' | 'pre-wrap' }` — defaults to `'normal'`

**Returns:** `PreparedText` (opaque, branded type — internals inaccessible)

### `layout(prepared, maxWidth, lineHeight)`
Pure arithmetic layout. No DOM, no canvas, no allocations.

```ts
import { prepare, layout } from '@chenglou/pretext'

const prepared = prepare('Hello world', '16px Inter')
const { height, lineCount } = layout(prepared, 300, 20)
// height = lineCount * lineHeight
```

**Parameters:**
- `prepared: PreparedText` — from `prepare()`
- `maxWidth: number` — container width in pixels
- `lineHeight: number` — CSS line-height in pixels

**Returns:** `{ lineCount: number, height: number }`

---

## Rich API (Segment-Level Control)

### `prepareWithSegments(text, font, options?)`
Like `prepare()` but exposes segment data for custom rendering.

```ts
import { prepareWithSegments } from '@chenglou/pretext'

const prepared = prepareWithSegments('Hello world', '16px Inter')
// prepared.segments: string[]
// prepared.widths: number[]
// prepared.kinds: SegmentBreakKind[]
// + bidi levels
```

### `layoutWithLines(prepared, maxWidth, lineHeight)`
Fixed-width batch layout returning all line objects.

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, font)
const { height, lineCount, lines } = layoutWithLines(prepared, 320, 20)

for (const line of lines) {
  console.log(line.text, line.width) // "Hello world", 89.5
}
```

**Returns:** `{ height, lineCount, lines: LayoutLine[] }`

Each `LayoutLine`:
```ts
{
  text: string       // the line's text content
  width: number      // pixel width of this line
  start: LayoutCursor
  end: LayoutCursor
}
```

### `walkLineRanges(prepared, maxWidth, onLine)`
Non-materializing geometry pass — no string building, just widths and cursors.

```ts
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, font)
let maxW = 0
walkLineRanges(prepared, 320, line => {
  if (line.width > maxW) maxW = line.width
})
// maxW = tightest container width (shrink-wrap)
```

**Use cases:** Binary-search for shrink-wrap width, balanced text layout.

### `layoutNextLine(prepared, start, maxWidth)`
Iterator-style API for variable-width layout. Each call returns one line.

```ts
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, font)
let cursor = { segmentIndex: 0, graphemeIndex: 0 }
let y = 0

while (true) {
  // Variable width per line — flow around an image
  const width = y < image.bottom ? columnWidth - image.width : columnWidth
  const line = layoutNextLine(prepared, cursor, width)
  if (line === null) break

  ctx.fillText(line.text, 0, y)
  cursor = line.end
  y += lineHeight
}
```

**This is what makes editorial layouts, obstacle avoidance, and shaped text possible.**

---

## Utility APIs

### `clearCache()`
Clears all internal caches (analysis, measurement, grapheme segmenters). Call when cycling through many different fonts.

### `setLocale(locale?)`
Sets locale for `Intl.Segmenter` used by future `prepare()` calls. Clears caches. Does not affect existing prepared handles.

---

## Types

```ts
type PreparedText                // Opaque handle (fast path)
type PreparedTextWithSegments    // Rich handle with segment data

type LayoutCursor = {
  segmentIndex: number
  graphemeIndex: number
}

type LayoutLine = {
  text: string
  width: number
  start: LayoutCursor
  end: LayoutCursor
}

type LayoutLineRange = {
  width: number
  start: LayoutCursor
  end: LayoutCursor
}

type LayoutResult = {
  lineCount: number
  height: number
}

type LayoutLinesResult = LayoutResult & {
  lines: LayoutLine[]
}

type PrepareOptions = {
  whiteSpace?: 'normal' | 'pre-wrap'
}
```

---

## Segment Break Kinds (Internal)

The library distinguishes 8 break kinds:

| Kind | Description |
|------|-------------|
| `text` | Normal text content |
| `space` | Collapsible space (CSS `white-space: normal`) |
| `preserved-space` | Preserved space (`pre-wrap` mode) |
| `tab` | Tab character (`pre-wrap`, follows `tab-size: 8`) |
| `glue` | Non-breaking space (`\u00A0`), narrow no-break space, word joiner, BOM |
| `zero-width-break` | Zero-width space (`\u200B`), explicit break opportunity |
| `soft-hyphen` | `\u00AD` — invisible unbroken, shows `-` when chosen as break |
| `hard-break` | `\n` in `pre-wrap` mode |

---

## Important Caveats

1. **`system-ui` is unsafe** — Canvas and DOM resolve to different optical variants on macOS (SF Pro Text vs SF Pro Display). Use named fonts.

2. **Fonts must be loaded** — Call `prepare()` after `document.fonts.ready`.

3. **Font string must match CSS** — The `font` parameter must exactly match the CSS font shorthand on the element.

4. **CSS target is fixed** — `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`, `line-break: auto`. Other configurations (`break-all`, `keep-all`, etc.) are untested.

5. **Horizontal measurement only** — Vertical metrics (line height) are always supplied by the caller.
