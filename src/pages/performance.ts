import { prepare, layout, prepareWithSegments, layoutWithLines, clearCache } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createPerfMeter } from '../components/performance-meter'

const BENCHMARK_TEXT = 'The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow. How vexingly quick daft zebras jump!'
const LONG_TEXT = Array(10).fill(BENCHMARK_TEXT).join(' ')

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Performance Guide</h1>
      <p class="content__subtitle">Benchmark data, caching strategies, and best practices for maximum throughput.</p>
    </div>

    <div class="content__section">
      <h2>Live Benchmarks</h2>
      <p>Run benchmarks on your current browser and hardware. Results may vary — run multiple times for consistent numbers.</p>
      <button id="run-bench" style="padding:var(--space-2) var(--space-4);background:var(--color-accent);color:var(--color-text-inverse);border:none;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;margin-bottom:var(--space-4);">Run Benchmarks</button>
      <div id="bench-perf" style="margin-bottom:var(--space-4)"></div>
      <div id="bench-results" style="overflow-x:auto"></div>
    </div>

    <div class="content__section">
      <h2>Reference Numbers</h2>
      <p>From the pretext documentation, measured on an M1 MacBook Pro:</p>
      <div style="overflow-x:auto;">
        <table style="width:100%;font-size:var(--text-sm);border-collapse:collapse;margin-top:var(--space-3)">
          <thead>
            <tr style="text-align:left;border-bottom:2px solid var(--color-border);">
              <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Operation</th>
              <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Chrome</th>
              <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Safari</th>
              <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--color-border-subtle);">
              <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:var(--color-accent);">prepare() (short text)</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.1ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.15ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-text-secondary);">First call; cached calls near-zero</td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-border-subtle);">
              <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:var(--color-accent);">prepare() (paragraph)</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.3ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.5ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-text-secondary);">First call with new text</td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-border-subtle);">
              <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:var(--color-accent);">layout()</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.005ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.008ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-text-secondary);">Per call, any width</td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-border-subtle);">
              <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:var(--color-accent);">layoutWithLines()</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.02ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-success);">~0.03ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-text-secondary);">Per call, allocates line objects</td>
            </tr>
            <tr>
              <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:var(--color-accent);">DOM offsetHeight</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-error);">~1-5ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-error);">~2-10ms</td>
              <td style="padding:var(--space-2) var(--space-3);color:var(--color-text-secondary);">Forced reflow per element</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="content__section">
      <h2>When to prepare()</h2>
      <div class="explanation">
        <p><span class="api-tag">prepare()</span> is the expensive step (0.1-0.5ms per text). Call it:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-3) 0;display:flex;flex-direction:column;gap:var(--space-2)">
          <li style="color:var(--color-success);font-size:var(--text-sm)">Once when text content is loaded or changes</li>
          <li style="color:var(--color-success);font-size:var(--text-sm)">NOT on every resize — only when text changes</li>
          <li style="color:var(--color-success);font-size:var(--text-sm)">After fonts are loaded (await document.fonts.ready)</li>
          <li style="color:var(--color-success);font-size:var(--text-sm)">In a batch during idle time for large datasets</li>
        </ul>
        <p><span class="api-tag">layout()</span> is the cheap step (0.005-0.01ms). Call it freely:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-3) 0;display:flex;flex-direction:column;gap:var(--space-2)">
          <li style="color:var(--color-accent);font-size:var(--text-sm)">On every resize</li>
          <li style="color:var(--color-accent);font-size:var(--text-sm)">On every animation frame</li>
          <li style="color:var(--color-accent);font-size:var(--text-sm)">In a binary search loop (10+ iterations)</li>
          <li style="color:var(--color-accent);font-size:var(--text-sm)">For 10,000+ items in one batch</li>
        </ul>
        <div class="key-insight">Think of prepare() as compilation and layout() as execution. Compile once, execute many times.</div>
      </div>
    </div>

    <div class="content__section">
      <h2>Caching Strategy</h2>
      <div class="explanation">
        <p>Pretext maintains an internal cache of glyph width measurements, keyed by font string. This cache is what makes layout() so fast — it never re-measures.</p>
        <h4 style="margin-top:var(--space-3)">How the cache works</h4>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li>Each unique font string (e.g., "16px Inter") gets its own measurement cache</li>
          <li>Segments like "the", " ", "quick" are measured once and reused across all texts</li>
          <li>The prepare() call checks the cache first — previously-seen segments skip measurement</li>
          <li>The cache persists for the page lifetime. Call clearCache() to release memory</li>
        </ul>
        <h4 style="margin-top:var(--space-3)">When to clear</h4>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li>After dynamically changing fonts (font-face swap, variable font axis change)</li>
          <li>When navigating away from text-heavy pages to free memory</li>
          <li>After calling setLocale() if segmentation rules changed</li>
        </ul>
      </div>
    </div>

    <div class="content__section">
      <h2>Browser Engine Profiles</h2>
      <div class="explanation">
        <p>Different browser engines have subtle differences in text layout. Pretext detects the browser at startup and adjusts its algorithm accordingly:</p>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-2) var(--space-4);margin:var(--space-3) 0;font-size:var(--text-sm)">
          <strong style="color:var(--color-accent)">Chrome/Blink</strong>
          <span style="color:var(--color-text-secondary)">Tight epsilon for line fitting, standard CJK handling</span>
          <strong style="color:var(--color-accent)">Safari/WebKit</strong>
          <span style="color:var(--color-text-secondary)">Different line-fit epsilon, CJK carry after closing quotes</span>
          <strong style="color:var(--color-accent)">Firefox/Gecko</strong>
          <span style="color:var(--color-text-secondary)">Prefers prefix widths for breakable runs, different soft-hyphen behavior</span>
        </div>
        <div class="key-insight">You don't need to think about this — pretext handles it automatically. The same API call produces browser-matching results everywhere.</div>
      </div>
    </div>

    <div class="content__section">
      <h2>Measurement Patterns</h2>
      <div id="patterns-source"></div>
    </div>
  `

  const perfMeter = createPerfMeter(document.getElementById('bench-perf')!)
  const benchResults = document.getElementById('bench-results')!

  document.getElementById('run-bench')!.addEventListener('click', () => {
    const results: { name: string; time: number; ops: number }[] = []

    // 1. prepare() cold (after cache clear)
    clearCache()
    const { elapsed: prepareCold } = timeExecution(() => prepare(BENCHMARK_TEXT, FONT))
    results.push({ name: 'prepare() cold', time: prepareCold, ops: 1 })

    // 2. prepare() warm (cache hit)
    const { elapsed: prepareWarm } = timeExecution(() => {
      for (let i = 0; i < 100; i++) prepare(BENCHMARK_TEXT, FONT)
    })
    results.push({ name: 'prepare() warm (x100)', time: prepareWarm, ops: 100 })

    // 3. layout() single
    const prepared = prepare(BENCHMARK_TEXT, FONT)
    const { elapsed: layoutSingle } = timeExecution(() => {
      for (let i = 0; i < 1000; i++) layout(prepared, 400, LINE_HEIGHT)
    })
    results.push({ name: 'layout() x1000', time: layoutSingle, ops: 1000 })

    // 4. layoutWithLines()
    const preparedFull = prepareWithSegments(BENCHMARK_TEXT, FONT)
    const { elapsed: layoutLinesBench } = timeExecution(() => {
      for (let i = 0; i < 1000; i++) layoutWithLines(preparedFull, 400, LINE_HEIGHT)
    })
    results.push({ name: 'layoutWithLines() x1000', time: layoutLinesBench, ops: 1000 })

    // 5. Long text prepare + layout
    clearCache()
    const { elapsed: longPrepare } = timeExecution(() => prepare(LONG_TEXT, FONT))
    results.push({ name: 'prepare() long text', time: longPrepare, ops: 1 })

    const preparedLong = prepare(LONG_TEXT, FONT)
    const { elapsed: longLayout } = timeExecution(() => {
      for (let i = 0; i < 1000; i++) layout(preparedLong, 400, LINE_HEIGHT)
    })
    results.push({ name: 'layout() long text x1000', time: longLayout, ops: 1000 })

    // 6. DOM comparison
    const { elapsed: domBench } = timeExecution(() => {
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div')
        div.style.cssText = `position:absolute;top:-9999px;left:-9999px;width:400px;font:${FONT};line-height:${LINE_HEIGHT}px`
        div.textContent = BENCHMARK_TEXT
        document.body.appendChild(div)
        div.offsetHeight
        document.body.removeChild(div)
      }
    })
    results.push({ name: 'DOM offsetHeight x100', time: domBench, ops: 100 })

    perfMeter.update([
      { label: 'layout() per call', value: layoutSingle / 1000 },
      { label: 'DOM per call', value: domBench / 100, slow: true },
    ])

    benchResults.innerHTML = `
      <table style="width:100%;font-size:var(--text-sm);border-collapse:collapse;margin-top:var(--space-3)">
        <thead>
          <tr style="text-align:left;border-bottom:2px solid var(--color-border);">
            <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Operation</th>
            <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Total</th>
            <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Per Op</th>
            <th style="padding:var(--space-2) var(--space-3);color:var(--color-text-tertiary);font-weight:600;">Ops/sec</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => {
            const perOp = r.time / r.ops
            const opsPerSec = 1000 / perOp
            const isSlow = r.name.includes('DOM')
            return `
              <tr style="border-bottom:1px solid var(--color-border-subtle);">
                <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:${isSlow ? 'var(--color-error)' : 'var(--color-accent)'};">${r.name}</td>
                <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);">${r.time.toFixed(2)}ms</td>
                <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:${isSlow ? 'var(--color-error)' : 'var(--color-success)'};">${perOp < 0.001 ? '<0.001ms' : perOp.toFixed(3) + 'ms'}</td>
                <td style="padding:var(--space-2) var(--space-3);font-family:var(--font-code);color:var(--color-text-secondary);">${opsPerSec > 1000000 ? (opsPerSec / 1000000).toFixed(1) + 'M' : opsPerSec > 1000 ? (opsPerSec / 1000).toFixed(1) + 'K' : Math.round(opsPerSec).toString()}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
  })

  const patternsCode = `// Pattern 1: Prepare once, layout on resize
const prepared = prepare(text, '16px Inter')
window.addEventListener('resize', () => {
  const { lineCount, height } = layout(prepared, container.clientWidth, 24)
  // Use dimensions...
})

// Pattern 2: Batch prepare during idle time
const texts = fetchAllItems()
const prepared = new Map()

requestIdleCallback(() => {
  for (const item of texts) {
    prepared.set(item.id, prepare(item.text, '16px Inter'))
  }
})

// Pattern 3: Animation loop with layoutNextLine
let rafId: number
function animate() {
  let cursor = { segmentIndex: 0, graphemeIndex: 0 }
  while (true) {
    const width = getWidthAtLine(y, obstacles)
    const line = layoutNextLine(prepared, cursor, width)
    if (!line) break
    ctx.fillText(line.text, x, y)
    cursor = line.end
    y += lineHeight
  }
  rafId = requestAnimationFrame(animate)
}

// Pattern 4: Binary search for balanced width
function findBalancedWidth(prepared, maxWidth, lineHeight) {
  const target = layout(prepared, maxWidth, lineHeight).lineCount
  let lo = 0, hi = maxWidth
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1
    layout(prepared, mid, lineHeight).lineCount <= target ? hi = mid : lo = mid
  }
  return hi
}`

  await createSourceViewer(document.getElementById('patterns-source')!, {
    code: patternsCode,
    title: 'Common Performance Patterns',
    startOpen: true,
  })
}

init()
