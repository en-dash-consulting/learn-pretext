import { prepare, layout, prepareWithSegments, layoutWithLines, walkLineRanges, layoutNextLine, clearCache, setLocale } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

interface ApiEntry {
  name: string
  signature: string
  description: string
  params: { name: string; type: string; description: string }[]
  returnType: string
  demoPage?: string
  demoLabel?: string
}

const APIS: ApiEntry[] = [
  {
    name: 'prepare',
    signature: 'prepare(text: string, font: string, options?: PrepareOptions): PreparedText',
    description: 'Analyzes and measures text, caching glyph widths for fast subsequent layout. The returned PreparedText is opaque — pass it to layout().',
    params: [
      { name: 'text', type: 'string', description: 'The text to prepare for layout.' },
      { name: 'font', type: 'string', description: 'CSS font shorthand (e.g., "16px Inter").' },
      { name: 'options', type: 'PrepareOptions', description: 'Optional. { whiteSpace?: "normal" | "pre-wrap" }' },
    ],
    returnType: 'PreparedText — opaque handle for use with layout()',
    demoPage: '/pages/accordion.html',
    demoLabel: 'Accordion demo',
  },
  {
    name: 'layout',
    signature: 'layout(prepared: PreparedText, maxWidth: number, lineHeight: number): LayoutResult',
    description: 'Computes line count and total height for prepared text at a given width. The fastest API — use when you only need dimensions.',
    params: [
      { name: 'prepared', type: 'PreparedText', description: 'Result from prepare() or prepareWithSegments().' },
      { name: 'maxWidth', type: 'number', description: 'Maximum line width in pixels.' },
      { name: 'lineHeight', type: 'number', description: 'Line height in pixels.' },
    ],
    returnType: 'LayoutResult — { lineCount: number, height: number }',
    demoPage: '/pages/masonry.html',
    demoLabel: 'Masonry demo',
  },
  {
    name: 'prepareWithSegments',
    signature: 'prepareWithSegments(text: string, font: string, options?: PrepareOptions): PreparedTextWithSegments',
    description: 'Like prepare(), but also exposes the segments array, their widths, and their kinds. Required for layoutWithLines(), walkLineRanges(), and layoutNextLine().',
    params: [
      { name: 'text', type: 'string', description: 'The text to prepare.' },
      { name: 'font', type: 'string', description: 'CSS font shorthand.' },
      { name: 'options', type: 'PrepareOptions', description: 'Optional. { whiteSpace?: "normal" | "pre-wrap" }' },
    ],
    returnType: 'PreparedTextWithSegments — includes segments: string[], widths: number[], kinds: SegmentBreakKind[]',
    demoPage: '/pages/pipeline.html',
    demoLabel: 'Pipeline demo',
  },
  {
    name: 'layoutWithLines',
    signature: 'layoutWithLines(prepared: PreparedTextWithSegments, maxWidth: number, lineHeight: number): LayoutLinesResult',
    description: 'Returns full layout result including an array of LayoutLine objects with text and width per line.',
    params: [
      { name: 'prepared', type: 'PreparedTextWithSegments', description: 'Result from prepareWithSegments().' },
      { name: 'maxWidth', type: 'number', description: 'Maximum line width in pixels.' },
      { name: 'lineHeight', type: 'number', description: 'Line height in pixels.' },
    ],
    returnType: 'LayoutLinesResult — { lineCount, height, lines: LayoutLine[] }',
    demoPage: '/pages/canvas.html',
    demoLabel: 'Canvas demo',
  },
  {
    name: 'walkLineRanges',
    signature: 'walkLineRanges(prepared: PreparedTextWithSegments, maxWidth: number, onLine: (line: LayoutLineRange) => void): number',
    description: 'Iterates over line ranges calling a callback for each line. Lower allocation than layoutWithLines() since it doesn\'t build the lines array. Returns line count.',
    params: [
      { name: 'prepared', type: 'PreparedTextWithSegments', description: 'Result from prepareWithSegments().' },
      { name: 'maxWidth', type: 'number', description: 'Maximum line width in pixels.' },
      { name: 'onLine', type: '(line: LayoutLineRange) => void', description: 'Callback invoked for each line with { width, start, end }.' },
    ],
    returnType: 'number — the total line count',
    demoPage: '/pages/bubbles.html',
    demoLabel: 'Chat Bubbles demo',
  },
  {
    name: 'layoutNextLine',
    signature: 'layoutNextLine(prepared: PreparedTextWithSegments, start: LayoutCursor, maxWidth: number): LayoutLine | null',
    description: 'Lays out a single line starting from the given cursor. Returns null when no more text remains. Allows per-line variable widths for obstacle avoidance.',
    params: [
      { name: 'prepared', type: 'PreparedTextWithSegments', description: 'Result from prepareWithSegments().' },
      { name: 'start', type: 'LayoutCursor', description: 'Starting position: { segmentIndex: number, graphemeIndex: number }.' },
      { name: 'maxWidth', type: 'number', description: 'Maximum width for this specific line.' },
    ],
    returnType: 'LayoutLine | null — { text, width, start, end } or null if done',
    demoPage: '/pages/editorial.html',
    demoLabel: 'Editorial Layout demo',
  },
  {
    name: 'clearCache',
    signature: 'clearCache(): void',
    description: 'Clears all cached glyph measurements. Call when fonts change dynamically or to free memory. After clearing, the next prepare() call will re-measure everything.',
    params: [],
    returnType: 'void',
  },
  {
    name: 'setLocale',
    signature: 'setLocale(locale?: string): void',
    description: 'Sets the locale used for text segmentation (Intl.Segmenter). Affects how text is split into words and where line breaks can occur. Pass undefined to reset to browser default.',
    params: [
      { name: 'locale', type: 'string | undefined', description: 'BCP 47 locale string (e.g., "en", "ja", "zh-Hans") or undefined for default.' },
    ],
    returnType: 'void',
    demoPage: '/pages/i18n.html',
    demoLabel: 'i18n demo',
  },
]

const TYPES = [
  { name: 'PreparedText', definition: 'Opaque handle returned by prepare(). Cannot be inspected directly.' },
  { name: 'PreparedTextWithSegments', definition: '{ segments: string[], widths: number[], kinds: SegmentBreakKind[], ... } — extends PreparedText with visible segment data.' },
  { name: 'LayoutResult', definition: '{ lineCount: number, height: number }' },
  { name: 'LayoutLine', definition: '{ text: string, width: number, start: LayoutCursor, end: LayoutCursor }' },
  { name: 'LayoutLineRange', definition: '{ width: number, start: LayoutCursor, end: LayoutCursor }' },
  { name: 'LayoutLinesResult', definition: '{ lineCount: number, height: number, lines: LayoutLine[] }' },
  { name: 'LayoutCursor', definition: '{ segmentIndex: number, graphemeIndex: number }' },
  { name: 'PrepareOptions', definition: '{ whiteSpace?: "normal" | "pre-wrap" }' },
]

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">API Reference</h1>
      <p class="content__subtitle">Complete reference for all public pretext APIs with interactive "try it" examples.</p>
    </div>

    <div class="content__section">
      <h2>Functions</h2>
      ${APIS.map((api, i) => `
        <div style="margin-bottom:var(--space-8);padding-bottom:var(--space-6);${i < APIS.length - 1 ? 'border-bottom:1px solid var(--color-border-subtle);' : ''}">
          <h3 id="api-${api.name}" style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;">
            <span class="api-tag">${api.name}()</span>
            ${api.demoPage ? `<a href="${api.demoPage}" style="font-size:var(--text-xs);color:var(--color-accent);">${api.demoLabel}</a>` : ''}
          </h3>
          <pre style="margin:var(--space-2) 0;"><code>${escapeHtml(api.signature)}</code></pre>
          <p style="color:var(--color-text-secondary);margin-bottom:var(--space-3)">${api.description}</p>
          ${api.params.length > 0 ? `
            <div style="overflow-x:auto;">
              <table style="width:100%;font-size:var(--text-sm);border-collapse:collapse;">
                <thead>
                  <tr style="text-align:left;border-bottom:1px solid var(--color-border);">
                    <th style="padding:var(--space-2);color:var(--color-text-tertiary);font-weight:500;">Parameter</th>
                    <th style="padding:var(--space-2);color:var(--color-text-tertiary);font-weight:500;">Type</th>
                    <th style="padding:var(--space-2);color:var(--color-text-tertiary);font-weight:500;">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${api.params.map(p => `
                    <tr style="border-bottom:1px solid var(--color-border-subtle);">
                      <td style="padding:var(--space-2);font-family:var(--font-code);color:var(--color-accent);">${p.name}</td>
                      <td style="padding:var(--space-2);font-family:var(--font-code);color:var(--color-warning);font-size:var(--text-xs);">${escapeHtml(p.type)}</td>
                      <td style="padding:var(--space-2);color:var(--color-text-secondary);">${p.description}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          <p style="font-size:var(--text-sm);margin-top:var(--space-2)">
            <span style="color:var(--color-text-tertiary)">Returns:</span>
            <code style="color:var(--color-success)">${escapeHtml(api.returnType)}</code>
          </p>
          <div style="margin-top:var(--space-3)">
            <div style="display:flex;gap:var(--space-2);align-items:center;margin-bottom:var(--space-2)">
              <input id="try-input-${api.name}" type="text" value="Hello, world!" style="flex:1;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-1) var(--space-2);color:var(--color-text);font-size:var(--text-sm);font-family:var(--font-code);" />
              <button id="try-btn-${api.name}" style="padding:var(--space-1) var(--space-3);background:var(--color-accent);color:var(--color-text-inverse);border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:var(--text-sm);font-weight:500;white-space:nowrap;">Try it</button>
            </div>
            <div id="try-result-${api.name}" style="font-family:var(--font-code);font-size:var(--text-xs);color:var(--color-text-secondary);min-height:20px;"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="content__section">
      <h2>Types</h2>
      ${TYPES.map(t => `
        <div style="margin-bottom:var(--space-4)">
          <h4 style="font-family:var(--font-code);color:var(--color-accent);">${t.name}</h4>
          <pre style="margin-top:var(--space-1);"><code>${escapeHtml(t.definition)}</code></pre>
        </div>
      `).join('')}
    </div>
  `

  // Wire up "Try it" buttons
  function tryApi(name: string) {
    const input = document.getElementById(`try-input-${name}`) as HTMLInputElement
    const resultEl = document.getElementById(`try-result-${name}`)!
    const text = input.value

    try {
      let output = ''
      const maxWidth = 300

      switch (name) {
        case 'prepare': {
          const start = performance.now()
          const p = prepare(text, FONT)
          const elapsed = performance.now() - start
          output = `PreparedText created in ${elapsed.toFixed(3)}ms (opaque — use with layout())`
          break
        }
        case 'layout': {
          const p = prepare(text, FONT)
          const start = performance.now()
          const r = layout(p, maxWidth, LINE_HEIGHT)
          const elapsed = performance.now() - start
          output = `{ lineCount: ${r.lineCount}, height: ${r.height} } in ${elapsed.toFixed(3)}ms (maxWidth: ${maxWidth})`
          break
        }
        case 'prepareWithSegments': {
          const start = performance.now()
          const p = prepareWithSegments(text, FONT)
          const elapsed = performance.now() - start
          output = `${p.segments.length} segments in ${elapsed.toFixed(3)}ms: [${p.segments.slice(0, 8).map(s => `"${s}"`).join(', ')}${p.segments.length > 8 ? '...' : ''}]`
          break
        }
        case 'layoutWithLines': {
          const p = prepareWithSegments(text, FONT)
          const start = performance.now()
          const r = layoutWithLines(p, maxWidth, LINE_HEIGHT)
          const elapsed = performance.now() - start
          output = `${r.lineCount} lines in ${elapsed.toFixed(3)}ms: ${r.lines.map(l => `"${l.text}" (${l.width.toFixed(1)}px)`).join(' | ')}`
          break
        }
        case 'walkLineRanges': {
          const p = prepareWithSegments(text, FONT)
          const widths: number[] = []
          const start = performance.now()
          const count = walkLineRanges(p, maxWidth, (line) => { widths.push(line.width) })
          const elapsed = performance.now() - start
          output = `${count} lines in ${elapsed.toFixed(3)}ms, widths: [${widths.map(w => w.toFixed(1)).join(', ')}]`
          break
        }
        case 'layoutNextLine': {
          const p = prepareWithSegments(text, FONT)
          const cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
          const start = performance.now()
          const line = layoutNextLine(p, cursor, maxWidth)
          const elapsed = performance.now() - start
          if (line) {
            output = `"${line.text}" width: ${line.width.toFixed(1)}px, end: {seg:${line.end.segmentIndex},g:${line.end.graphemeIndex}} in ${elapsed.toFixed(3)}ms`
          } else {
            output = 'null (empty text)'
          }
          break
        }
        case 'clearCache': {
          const start = performance.now()
          clearCache()
          const elapsed = performance.now() - start
          output = `Cache cleared in ${elapsed.toFixed(3)}ms`
          break
        }
        case 'setLocale': {
          const locale = text || undefined
          const start = performance.now()
          setLocale(locale)
          const elapsed = performance.now() - start
          output = `Locale set to "${locale ?? 'default'}" in ${elapsed.toFixed(3)}ms`
          setLocale(undefined) // reset
          break
        }
      }

      resultEl.innerHTML = `<span style="color:var(--color-success)">${escapeHtml(output)}</span>`
    } catch (err) {
      resultEl.innerHTML = `<span style="color:var(--color-error)">Error: ${escapeHtml(String(err))}</span>`
    }
  }

  APIS.forEach(api => {
    const btn = document.getElementById(`try-btn-${api.name}`)!
    const input = document.getElementById(`try-input-${api.name}`) as HTMLInputElement

    btn.addEventListener('click', () => tryApi(api.name))
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryApi(api.name)
    })

    // Run once on load
    tryApi(api.name)
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
