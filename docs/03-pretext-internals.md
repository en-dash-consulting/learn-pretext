# Pretext: Architecture & Internals

## Source Structure

| File | Purpose | ~Lines |
|------|---------|--------|
| `layout.ts` | Main entry point, all public exports, prepare/layout orchestration | 718 |
| `analysis.ts` | Text normalization, Intl.Segmenter segmentation, whitespace collapsing, punctuation merging, glue rules, CJK/Arabic/Myanmar/URL/numeric special cases | 1007 |
| `measurement.ts` | Canvas measureText() wrapper, segment metrics cache, emoji correction, browser engine profile detection | 232 |
| `line-break.ts` | Line-walking engine — simple fast path + full path with soft hyphens, tabs, hard breaks, preserved spaces | 1057 |
| `bidi.ts` | Simplified Unicode Bidi Algorithm (forked from pdf.js), computes embedding levels for mixed LTR/RTL | 174 |
| `layout.test.ts` | Deterministic tests using a fake canvas backend | 627 |

## Internal Pipeline (`prepare()`)

1. **Normalization** (`analysis.ts`)
   - Collapse whitespace per CSS `white-space: normal` rules (or preserve for `pre-wrap`)
   - Normalize `\r\n` → `\n`

2. **Segmentation** (`analysis.ts`)
   - `Intl.Segmenter(locale, { granularity: 'word' })` splits into word/non-word segments
   - Further split by break kind (text, space, tab, glue, zero-width-break, soft-hyphen, hard-break)

3. **Merging and Glue Rules** (`analysis.ts`)
   Complex language-aware merging passes:
   - Merge punctuation into preceding word (`"hello."` → one unit)
   - Merge Arabic no-space punctuation clusters
   - Merge Myanmar medial glue
   - Carry forward-sticky characters (opening quotes) to following word
   - CJK kinsoku rules (line-start/end prohibited characters)
   - Merge URL-like runs into breakable segments
   - Merge numeric/time expressions (`7:00-9:00`, `420-69-8008`)
   - Merge ASCII punctuation chains (`foo;bar`)
   - Handle non-breaking spaces, zero-width spaces, soft hyphens

4. **Measurement** (`measurement.ts`)
   - `canvas.measureText()` per segment
   - Cached: `Map<font, Map<segmentText, SegmentMetrics>>`
   - Emoji width correction: Chrome/Firefox canvas measures emoji wider than DOM at <24px on macOS

5. **CJK Splitting** (`layout.ts`)
   - CJK segments → individual graphemes with kinsoku merging

6. **Breakable Pre-measurement**
   - Word segments >1 char: pre-compute per-grapheme widths for `overflow-wrap: break-word`

7. **Bidi Levels** (rich path only, `bidi.ts`)
   - Unicode bidi embedding levels for custom rendering

8. **Chunk Compilation** (`pre-wrap` only)
   - Hard-break-delimited chunks for the line walker

## Browser Engine Profiles

```ts
type EngineProfile = {
  lineFitEpsilon: number                      // Safari: 1/64, Chrome/FF: 0.005
  carryCJKAfterClosingQuote: boolean          // Chromium only
  preferPrefixWidthsForBreakableRuns: boolean // Safari only
  preferEarlySoftHyphenBreak: boolean         // Safari only
}
```

## Line Breaking Algorithm

Two code paths in `line-break.ts`:

### Simple Fast Path
Used when: no hard breaks, soft hyphens, tabs, or preserved spaces (the common case).

### Full Path
Handles all break kinds:
- Soft hyphens with discretionary hyphen width accounting
- Tab stops (`tab-size: 8`, position-dependent advance)
- Hard breaks (`\n` in `pre-wrap`)
- Preserved whitespace

### CSS Behavior Matched
- `white-space: normal` (or `pre-wrap`)
- `word-break: normal`
- `overflow-wrap: break-word` (words wider than container break at grapheme boundaries)
- `line-break: auto`

## Caching Strategy

| Cache | Scope | Key |
|-------|-------|-----|
| Segment metrics | Global | `Map<font, Map<segmentText, SegmentMetrics>>` |
| Emoji correction | Global | `Map<font, correctionValue>` |
| Word segmenter | Module singleton | Recreated on locale change |
| Grapheme segmenter | Module singleton | — |
| Line text | WeakMap per PreparedTextWithSegments | `segmentIndex → graphemes[]` |

## i18n Support

- **CJK**: Per-character line breaking with kinsoku rules (Hiragana, Katakana, Kanji, Hangul, CJK compatibility ideographs, astral CJK)
- **Arabic/Urdu**: RTL, punctuation merging, no-space clusters, combining marks
- **Thai/Lao/Khmer**: Word segmentation via `Intl.Segmenter`
- **Myanmar**: Punctuation attachment, medial glue, possessive markers
- **Hindi/Devanagari**: Danda/double danda attachment
- **Emoji**: Auto-corrected for Chrome/Firefox canvas inflation, ZWJ sequences, variation selectors
- **Mixed bidi**: Simplified bidi algorithm for rendering metadata
- **Soft hyphens**: Invisible when unbroken, visible `-` when chosen as break
- **NBSP variants**: `\u00A0`, `\u202F`, `\u2060`, `\uFEFF`

## Edge Cases

1. **Trailing whitespace hangs** — Like CSS, trailing spaces "hang" past the edge
2. **Soft hyphen continuation** — After a soft-hyphen break, further word-breaking continues
3. **URL breaking** — Two breakable units: path through `?`, then query string
4. **Emoji width correction** — Auto-detected per-font DOM probe, cached
5. **Line-fit epsilon** — Browser-specific tolerance for sub-pixel rounding
6. **Pre-wrap tab stops** — Position-dependent, snaps to next `tab-size: 8` stop
7. **CJK closing quote carry** — Chromium-specific segment behavior
8. **Measurement is horizontal-only** — Vertical metrics always caller-supplied
