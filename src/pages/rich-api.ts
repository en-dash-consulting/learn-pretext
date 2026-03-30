import { prepare, layout, prepareWithSegments, layoutWithLines, layoutNextLine } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createSlider } from '../components/slider'
import { createPerfMeter } from '../components/performance-meter'

const SAMPLE_TEXT = 'Pretext is a JavaScript library for measuring and laying out multiline text without the DOM. It uses pure arithmetic over cached glyph widths to predict line breaks, line counts, and heights. The prepare step analyzes and measures text segments once, then layout can be called repeatedly at different widths with negligible cost.'

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Rich API</h1>
      <p class="content__subtitle">Three API paths for the same text — pick the level of detail you need.</p>
    </div>

    <div class="content__section">
      <div id="api-slider" style="margin-bottom:var(--space-4)"></div>
      <div id="api-perf" style="margin-bottom:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <h2>1. Fast Path: <span class="api-tag">prepare()</span> + <span class="api-tag">layout()</span></h2>
      <p>Returns just the line count and total height. The fastest option when you only need dimensions.</p>
      <div class="demo-area" id="fast-result" style="font-family:var(--font-code);font-size:var(--text-sm)"></div>
      <div id="fast-source" style="margin-top:var(--space-3)"></div>
    </div>

    <div class="content__section">
      <h2>2. Lines Path: <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutWithLines()</span></h2>
      <p>Returns an array of LayoutLine objects, each with the text content and pixel width of that line.</p>
      <div class="demo-area" id="lines-result" style="font-family:var(--font-code);font-size:var(--text-sm)"></div>
      <div id="lines-source" style="margin-top:var(--space-3)"></div>
    </div>

    <div class="content__section">
      <h2>3. Iterator Path: <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutNextLine()</span></h2>
      <p>Builds lines one at a time. You provide the starting cursor and max width — great for variable-width layouts like text flowing around obstacles.</p>
      <div class="demo-area" id="iter-result" style="font-family:var(--font-code);font-size:var(--text-sm)"></div>
      <div id="iter-source" style="margin-top:var(--space-3)"></div>
    </div>

    <div class="content__section">
      <h2>Decision Guide</h2>
      <div class="explanation">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-2) var(--space-4);align-items:start;font-size:var(--text-sm)">
          <span class="api-tag">layout()</span>
          <span style="color:var(--color-text-secondary)">Need height/lineCount only. Virtual scroll, masonry, accordion. Fastest path.</span>

          <span class="api-tag">layoutWithLines()</span>
          <span style="color:var(--color-text-secondary)">Need per-line text and widths. Canvas rendering, shrink-wrapping, balanced text, kinetic typography.</span>

          <span class="api-tag">layoutNextLine()</span>
          <span style="color:var(--color-text-secondary)">Need variable width per line. Editorial layouts with obstacles, custom text shaping, non-rectangular containers.</span>

          <span class="api-tag">walkLineRanges()</span>
          <span style="color:var(--color-text-secondary)">Need line widths without text extraction. Bubble sizing, balanced width search. Low-allocation alternative to layoutWithLines.</span>
        </div>
        <div class="key-insight" style="margin-top:var(--space-4)">
          All paths share the same <code>prepare()</code> or <code>prepareWithSegments()</code> step. The prepare result is reusable across calls — prepare once, layout many times at different widths.
        </div>
      </div>
    </div>
  `

  const preparedSimple = prepare(SAMPLE_TEXT, FONT)
  const preparedFull = prepareWithSegments(SAMPLE_TEXT, FONT)

  let maxWidth = 400
  const perfMeter = createPerfMeter(document.getElementById('api-perf')!)

  function update() {
    // Fast path
    const { result: fastResult, elapsed: fastTime } = timeExecution(() =>
      layout(preparedSimple, maxWidth, LINE_HEIGHT)
    )
    document.getElementById('fast-result')!.innerHTML = `
      <div style="color:var(--color-accent)">layout(prepared, ${maxWidth}, ${LINE_HEIGHT})</div>
      <div style="margin-top:var(--space-2)">
        <span style="color:var(--color-text-tertiary)">Result:</span>
        { lineCount: <span style="color:var(--color-success)">${fastResult.lineCount}</span>, height: <span style="color:var(--color-success)">${fastResult.height}</span> }
      </div>
    `

    // Lines path
    const { result: linesResult, elapsed: linesTime } = timeExecution(() =>
      layoutWithLines(preparedFull, maxWidth, LINE_HEIGHT)
    )
    const linesHtml = linesResult.lines.map((line, i) => `
      <div style="display:flex;gap:var(--space-3);align-items:baseline;padding:var(--space-1) 0;${i > 0 ? 'border-top:1px solid var(--color-border-subtle);' : ''}">
        <span style="color:var(--color-text-tertiary);min-width:20px">L${i + 1}</span>
        <span style="color:var(--color-text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"${escapeHtml(line.text)}"</span>
        <span style="color:var(--color-accent);white-space:nowrap">${line.width.toFixed(1)}px</span>
      </div>
    `).join('')
    document.getElementById('lines-result')!.innerHTML = `
      <div style="color:var(--color-accent);margin-bottom:var(--space-2)">layoutWithLines(prepared, ${maxWidth}, ${LINE_HEIGHT})</div>
      <div style="margin-bottom:var(--space-2)">
        <span style="color:var(--color-text-tertiary)">lineCount: ${linesResult.lineCount}, height: ${linesResult.height}</span>
      </div>
      ${linesHtml}
    `

    // Iterator path
    const iterLines: { text: string; width: number; cursor: string }[] = []
    const { elapsed: iterTime } = timeExecution(() => {
      let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
      while (true) {
        const line = layoutNextLine(preparedFull, cursor, maxWidth)
        if (!line) break
        iterLines.push({
          text: line.text,
          width: line.width,
          cursor: `{seg:${cursor.segmentIndex},g:${cursor.graphemeIndex}}`,
        })
        cursor = line.end
      }
    })
    const iterHtml = iterLines.map((line, i) => `
      <div style="display:flex;gap:var(--space-3);align-items:baseline;padding:var(--space-1) 0;${i > 0 ? 'border-top:1px solid var(--color-border-subtle);' : ''}">
        <span style="color:var(--color-text-tertiary);min-width:20px">L${i + 1}</span>
        <span style="color:var(--color-warning);font-size:var(--text-xs);min-width:80px">${line.cursor}</span>
        <span style="color:var(--color-text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">"${escapeHtml(line.text)}"</span>
        <span style="color:var(--color-accent);white-space:nowrap">${line.width.toFixed(1)}px</span>
      </div>
    `).join('')
    document.getElementById('iter-result')!.innerHTML = `
      <div style="color:var(--color-accent);margin-bottom:var(--space-2)">layoutNextLine(prepared, cursor, ${maxWidth}) in a loop</div>
      ${iterHtml}
    `

    perfMeter.update([
      { label: 'layout()', value: fastTime },
      { label: 'layoutWithLines()', value: linesTime },
      { label: 'layoutNextLine() loop', value: iterTime },
    ])
  }

  createSlider(document.getElementById('api-slider')!, {
    label: 'Max Width',
    min: 150,
    max: 700,
    value: 400,
    step: 10,
    formatValue: v => `${v}px`,
    onChange: v => {
      maxWidth = v
      update()
    },
  })

  update()

  // Source viewers
  await Promise.all([
    createSourceViewer(document.getElementById('fast-source')!, {
      code: `import { prepare, layout } from '@chenglou/pretext'

const prepared = prepare(text, '16px Inter')
const { lineCount, height } = layout(prepared, maxWidth, 24)`,
      title: 'Fast Path',
    }),
    createSourceViewer(document.getElementById('lines-source')!, {
      code: `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '16px Inter')
const { lineCount, height, lines } = layoutWithLines(prepared, maxWidth, 24)

lines.forEach(line => {
  console.log(line.text, line.width) // per-line text and width
})`,
      title: 'Lines Path',
    }),
    createSourceViewer(document.getElementById('iter-source')!, {
      code: `import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '16px Inter')
let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }

while (true) {
  const line = layoutNextLine(prepared, cursor, maxWidth)
  if (!line) break

  console.log(line.text, line.width)
  cursor = line.end // advance cursor to start of next line
}`,
      title: 'Iterator Path',
    }),
  ])
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
