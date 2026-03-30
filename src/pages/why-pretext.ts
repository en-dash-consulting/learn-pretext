import { prepare, layout } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createPerfMeter } from '../components/performance-meter'
const SAMPLE_TEXTS = Array.from({ length: 200 }, (_, i) => {
  const variants = [
    'The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow.',
    'How vexingly quick daft zebras jump! Two driven jocks help fax my big quiz.',
    'We promptly judged antique ivory buckles for the next prize. Crazy Frederick bought many very exquisite opal jewels.',
    'Sixty zippers were quickly picked from the woven jute bag. A quick movement of the enemy will jeopardize six gunboats.',
    'All questions asked by five watched experts amaze the judge. Jack quietly moved up front and seized the big ball of wax.',
    'Grumpy wizards make toxic brew for the evil queen and jack. The jay, pig, fox, and my wolves quack nonstop.',
    'By Jove, my quick study of lexicography won a prize. Waltz, nymph, for quick jigs vex bud.',
    'My faxed joke won a pager in the cable TV quiz show. The five curious gnomes jumped over a low brick wall quickly.',
  ]
  return variants[i % variants.length]!
})

function domMeasureBatch(texts: string[], width: number): number[] {
  const heights: number[] = []
  for (const text of texts) {
    const div = document.createElement('div')
    div.style.cssText = `position:absolute;top:-9999px;left:-9999px;width:${width}px;font:${FONT};line-height:${LINE_HEIGHT}px;white-space:normal;word-wrap:break-word;`
    div.textContent = text
    document.body.appendChild(div)
    heights.push(div.offsetHeight)
    document.body.removeChild(div)
  }
  return heights
}

function pretextMeasureBatch(preparedTexts: ReturnType<typeof prepare>[], width: number): number[] {
  return preparedTexts.map(p => layout(p, width, LINE_HEIGHT).height)
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  const preparedTexts = SAMPLE_TEXTS.map(t => prepare(t, FONT))

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Why Pretext</h1>
      <p class="content__subtitle">Understanding layout thrashing and why offloading text measurement to pure arithmetic matters.</p>
    </div>

    <div class="content__section">
      <h2>The Layout Thrashing Problem</h2>
      <p>Every time you read an element's dimensions (offsetHeight, getBoundingClientRect) after writing to the DOM (changing content, styles, or dimensions), the browser must synchronously recalculate layout. When you do this in a loop for hundreds of elements, you force the browser into a costly read-write-read-write cycle known as <strong>layout thrashing</strong>.</p>
      <p>Pretext eliminates this entirely by measuring text with pure arithmetic over cached glyph widths. No DOM, no reflow, no thrashing.</p>
    </div>

    <div class="content__section">
      <h2>Live Comparison: 200 Text Blocks</h2>
      <p>Both methods measure the same 200 texts at 400px width. Hit the button to see the difference on your hardware.</p>
      <div class="demo-area" id="demo-area" style="text-align:center;">
        <button id="run-btn" style="padding:var(--space-3) var(--space-6);background:var(--gradient-accent);color:var(--color-text-inverse);border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:600;font-size:var(--text-base);box-shadow:var(--shadow-md);transition:all 200ms ease;">Run Benchmark</button>
        <div id="result-display" style="margin-top:var(--space-6);text-align:left;"></div>
      </div>
      <div id="perf-container" style="margin-top:var(--space-4)"></div>
      <div id="source-comparison"></div>
    </div>

    <div class="content__section">
      <h2>What CSS Can't Do</h2>
      <div class="explanation">
        <h3>Obstacle Avoidance</h3>
        <p>CSS floats can wrap text around rectangles, but they cannot handle arbitrary shapes, dynamic obstacles, or per-line variable widths. Pretext's <span class="api-tag">layoutNextLine()</span> accepts a different maxWidth for each line, enabling text to flow around circles, polygons, or draggable objects.</p>
      </div>
      <div class="explanation">
        <h3>Shrink-Wrap Width</h3>
        <p>CSS <code>width: fit-content</code> sets the container to the intrinsic width of the content, but for multiline text this equals the max-width, not the actual widest line. Pretext's <span class="api-tag">walkLineRanges()</span> reports the exact pixel width of each line, so you can size a container to the widest rendered line — true shrink-wrapping.</p>
      </div>
      <div class="explanation">
        <h3>Virtualization</h3>
        <p>To virtualize a list of variable-height text items, you need each item's height before rendering it. CSS requires rendering to measure. Pretext computes heights from cached glyph widths alone, so you can predict 10,000+ item heights in under 10ms without creating a single DOM node.</p>
      </div>
      <div class="explanation">
        <h3>Balanced Text</h3>
        <p>CSS <code>text-wrap: balance</code> exists but only works for short blocks (up to 6 lines in Chrome). Pretext lets you binary-search for the narrowest container width that doesn't add extra lines — perfect balance for any length, any font, any width.</p>
      </div>
      <div class="explanation">
        <h3>Animation-Speed Layout</h3>
        <p>Interactive features like draggable obstacles, live resize, or kinetic typography need text layout every frame at 60fps. DOM measurement costs 1-40ms per call; Pretext costs 0.01-0.1ms. That's the difference between 60fps and 2fps.</p>
        <div class="key-insight">Pretext turns text measurement from an I/O operation (DOM round-trip) into a computation (cached arithmetic), unlocking use cases that were previously impossible at interactive frame rates.</div>
      </div>
    </div>
  `

  const perfMeter = createPerfMeter(document.getElementById('perf-container')!)
  const resultDisplay = document.getElementById('result-display')!
  const runBtn = document.getElementById('run-btn') as HTMLButtonElement

  runBtn.addEventListener('click', () => {
    const width = 400
    runBtn.textContent = 'Running...'
    runBtn.disabled = true

    // Slight delay so the button state renders
    requestAnimationFrame(() => {
      const { elapsed: domTime } = timeExecution(() => domMeasureBatch(SAMPLE_TEXTS, width))
      const { elapsed: pretextTime } = timeExecution(() => pretextMeasureBatch(preparedTexts, width))

      perfMeter.update([
        { label: 'DOM (200 texts)', value: domTime, slow: true },
        { label: 'Pretext (200 texts)', value: pretextTime },
      ])

      const speedup = domTime / Math.max(pretextTime, 0.001)
      resultDisplay.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-4);text-align:center;">
          <div style="padding:var(--space-4);background:var(--color-bg-surface);border-radius:var(--radius-md);border:1px solid var(--color-border);">
            <div style="font-family:var(--font-code);font-size:var(--text-2xl);font-weight:700;color:var(--color-error);font-variant-numeric:tabular-nums;">${domTime.toFixed(1)}ms</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);text-transform:uppercase;letter-spacing:0.05em;">DOM</div>
          </div>
          <div style="padding:var(--space-4);background:var(--color-bg-surface);border-radius:var(--radius-md);border:1px solid var(--color-border);">
            <div style="font-family:var(--font-code);font-size:var(--text-2xl);font-weight:700;color:var(--color-success);font-variant-numeric:tabular-nums;">${pretextTime < 0.1 ? pretextTime.toFixed(2) : pretextTime.toFixed(1)}ms</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);text-transform:uppercase;letter-spacing:0.05em;">Pretext</div>
          </div>
          <div style="padding:var(--space-4);background:var(--gradient-accent-soft);border-radius:var(--radius-md);border:1px solid rgba(129,140,248,0.15);">
            <div style="font-family:var(--font-code);font-size:var(--text-2xl);font-weight:700;color:var(--color-accent);font-variant-numeric:tabular-nums;">${speedup.toFixed(0)}x</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);text-transform:uppercase;letter-spacing:0.05em;">Faster</div>
          </div>
        </div>
      `

      runBtn.textContent = 'Run Again'
      runBtn.disabled = false
    })
  })

  const sourceCode = `import { prepare, layout } from '@chenglou/pretext'

const FONT = '16px Inter'
const LINE_HEIGHT = 24

// --- DOM Measurement (causes layout thrashing) ---
function domMeasureBatch(texts: string[], width: number) {
  const heights: number[] = []
  for (const text of texts) {
    const div = document.createElement('div')
    div.style.cssText = \`position:absolute;width:\${width}px;font:\${FONT};line-height:\${LINE_HEIGHT}px\`
    div.textContent = text
    document.body.appendChild(div)
    heights.push(div.offsetHeight)    // FORCED REFLOW on every iteration!
    document.body.removeChild(div)
  }
  return heights
}

// --- Pretext (pure arithmetic, no DOM) ---
function pretextMeasureBatch(preparedTexts: PreparedText[], width: number) {
  return preparedTexts.map(p => layout(p, width, LINE_HEIGHT).height)
}`

  await createSourceViewer(document.getElementById('source-comparison')!, {
    code: sourceCode,
    title: 'Measurement Comparison',
  })
}

init()
