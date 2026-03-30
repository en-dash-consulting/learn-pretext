import { prepare, layout } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createSlider } from '../components/slider'

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Getting Started</h1>
      <p class="content__subtitle">Install pretext and measure your first text in under a minute.</p>
    </div>

    <div class="content__section">
      <h2>Installation</h2>
      <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4)">
        <div>
          <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-1)">npm</p>
          <pre><code>npm install @chenglou/pretext</code></pre>
        </div>
        <div>
          <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-1)">bun</p>
          <pre><code>bun add @chenglou/pretext</code></pre>
        </div>
        <div>
          <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-1)">yarn</p>
          <pre><code>yarn add @chenglou/pretext</code></pre>
        </div>
      </div>
    </div>

    <div class="content__section">
      <h2>Minimal Example</h2>
      <p>Eight lines to measure text without the DOM:</p>
      <pre><code>import { prepare, layout } from '@chenglou/pretext'

await document.fonts.ready

const prepared = prepare('Hello, world!', '16px Inter')
const result = layout(prepared, 200, 24)

console.log(result) // { lineCount: 1, height: 24 }</code></pre>
      <div class="demo-area" style="margin-top:var(--space-4)">
        <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2)">Live result:</p>
        <div id="minimal-result" style="font-family:var(--font-code);font-size:var(--text-sm);color:var(--color-accent)"></div>
      </div>
    </div>

    <div class="content__section">
      <h2>Interactive Sandbox</h2>
      <p>Edit the text and adjust the width to see pretext in action.</p>
      <div class="demo-area" style="margin-top:var(--space-4)">
        <div style="margin-bottom:var(--space-4)">
          <label style="display:block;font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-2)">Input text</label>
          <textarea id="sandbox-input" rows="4" style="width:100%;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-3);color:var(--color-text);font:var(--text-base) var(--font-body);resize:vertical;">The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow. How vexingly quick daft zebras jump!</textarea>
        </div>
        <div id="sandbox-slider" style="margin-bottom:var(--space-4)"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div>
            <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2)">Pretext prediction</p>
            <div id="sandbox-stats" style="font-family:var(--font-code);font-size:var(--text-sm)"></div>
          </div>
          <div>
            <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2)">Visual preview</p>
            <div id="sandbox-preview" style="font:${FONT};line-height:${LINE_HEIGHT}px;border:1px dashed var(--color-border);padding:var(--space-2);overflow:hidden;word-wrap:break-word;"></div>
          </div>
        </div>
      </div>
      <div id="sandbox-source"></div>
    </div>

    <div class="content__section">
      <h2>Font Loading</h2>
      <div class="explanation">
        <p>Pretext measures text using the browser's canvas API internally. For accurate results, fonts must be fully loaded before calling <span class="api-tag">prepare()</span>. The simplest approach:</p>
        <pre><code>await document.fonts.ready</code></pre>
        <p>This resolves when all fonts referenced in CSS that are needed for visible content have finished loading. If you load fonts dynamically (e.g., via FontFace API), wait for those promises too.</p>
        <div class="key-insight">
          If you call <code>prepare()</code> before the font loads, glyph widths will be measured using the fallback font. The cache will store those incorrect widths, and subsequent layouts will be wrong. Always wait for fonts first.
        </div>
        <p style="margin-top:var(--space-3)">For dynamic font loading:</p>
        <pre><code>const font = new FontFace('MyFont', 'url(/my-font.woff2)')
await font.load()
document.fonts.add(font)
// NOW safe to call prepare()</code></pre>
      </div>
    </div>
  `

  // Minimal example result
  const minimalPrepared = prepare('Hello, world!', FONT)
  const minimalResult = layout(minimalPrepared, 200, LINE_HEIGHT)
  document.getElementById('minimal-result')!.textContent =
    `{ lineCount: ${minimalResult.lineCount}, height: ${minimalResult.height} }`

  // Sandbox
  const sandboxInput = document.getElementById('sandbox-input') as HTMLTextAreaElement
  const sandboxStats = document.getElementById('sandbox-stats')!
  const sandboxPreview = document.getElementById('sandbox-preview')!

  let maxWidth = 400

  function updateSandbox() {
    const text = sandboxInput.value
    if (!text.trim()) {
      sandboxStats.innerHTML = '<span style="color:var(--color-text-tertiary)">Enter some text above</span>'
      sandboxPreview.textContent = ''
      return
    }

    const { result: prepared, elapsed: prepareTime } = timeExecution(() => prepare(text, FONT))
    const { result, elapsed: layoutTime } = timeExecution(() => layout(prepared, maxWidth, LINE_HEIGHT))

    sandboxStats.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-1)">
        <span>Lines: <span style="color:var(--color-accent)">${result.lineCount}</span></span>
        <span>Height: <span style="color:var(--color-accent)">${result.height}px</span></span>
        <span>prepare(): <span style="color:var(--color-accent)">${prepareTime.toFixed(2)}ms</span></span>
        <span>layout(): <span style="color:var(--color-accent)">${layoutTime.toFixed(3)}ms</span></span>
      </div>
    `

    sandboxPreview.style.width = `${maxWidth}px`
    sandboxPreview.textContent = text
  }

  createSlider(document.getElementById('sandbox-slider')!, {
    label: 'Max Width',
    min: 200,
    max: 800,
    value: 400,
    step: 10,
    formatValue: v => `${v}px`,
    onChange: v => {
      maxWidth = v
      updateSandbox()
    },
  })

  sandboxInput.addEventListener('input', updateSandbox)
  updateSandbox()

  const sandboxSourceCode = `import { prepare, layout } from '@chenglou/pretext'

await document.fonts.ready

const text = textarea.value
const prepared = prepare(text, '16px Inter')
const result = layout(prepared, maxWidth, 24)

// result.lineCount — number of lines the text wraps to
// result.height   — total pixel height (lineCount * lineHeight)`

  await createSourceViewer(document.getElementById('sandbox-source')!, {
    code: sandboxSourceCode,
    title: 'Sandbox Source',
  })
}

init()
