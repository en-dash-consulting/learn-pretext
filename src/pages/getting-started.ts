import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createSlider } from '../components/slider'

const TASK_TEXT =
  'Pretext measures and lays out multiline text without ever touching the DOM, using pure arithmetic.'

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Pretext.js Tutorial: Getting Started</h1>
      <p class="content__subtitle">Install pretext, run your first measurement, and render wrapped lines yourself — a step-by-step tutorial you can finish in under 10 minutes.</p>
    </div>

    <div class="content__section">
      <h2>What is pretext?</h2>
      <div class="explanation">
        <p><strong>Pretext</strong> is a zero-dependency JavaScript/TypeScript library for multiline text measurement and layout, created by <a href="https://github.com/chenglou" target="_blank" rel="noopener">Cheng Lou</a>. It computes line breaks, line count, and pixel height using pure arithmetic — without touching the DOM — so a layout that would cost a forced reflow in the browser costs ~0.01ms of math instead. The core is two functions: <span class="api-tag">prepare()</span> measures the text's glyphs once, and <span class="api-tag">layout()</span> answers "how many lines, how tall?" for any width you throw at it. If you want the full argument for why that matters, read <a href="/pages/why-pretext.html">Why Pretext</a> — otherwise, let's build something.</p>
      </div>
    </div>

    <div class="content__section">
      <h2>Step 1 — Install</h2>
      <p>With a bundler (Vite, webpack, etc.), install from npm:</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4)">
        <div>
          <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-1)">npm</p>
          <pre><code>npm install @chenglou/pretext</code></pre>
        </div>
        <div>
          <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-1)">bun / yarn</p>
          <pre><code>bun add @chenglou/pretext
yarn add @chenglou/pretext</code></pre>
        </div>
      </div>
      <p style="margin-top:var(--space-4)">No build step? The package ships as an ES module, so you can import it straight from a CDN in a plain HTML file — no bundler required:</p>
      <pre><code>&lt;script type="module"&gt;
  import { prepare, layout } from 'https://esm.sh/@chenglou/pretext@0.0.3'

  // your code here
&lt;/script&gt;</code></pre>
      <p>Either way you get the same API. The rest of this tutorial uses the npm import — swap in the CDN URL if you're going buildless.</p>
    </div>

    <div class="content__section">
      <h2>Step 2 — Load your font first</h2>
      <div class="explanation">
        <p>Pretext measures glyphs with the browser's canvas API internally, so the font you measure with must be fully loaded <em>before</em> you call <span class="api-tag">prepare()</span>. One line handles it:</p>
        <pre><code>await document.fonts.ready</code></pre>
        <div class="key-insight">
          If you call <code>prepare()</code> before the font loads, glyph widths are measured against the fallback font — and cached. Every layout after that is silently wrong. Always wait for fonts first.
        </div>
        <p style="margin-top:var(--space-3)">Loading a font dynamically? Wait for that promise too:</p>
        <pre><code>const font = new FontFace('MyFont', 'url(/my-font.woff2)')
await font.load()
document.fonts.add(font)
// NOW safe to call prepare()</code></pre>
      </div>
    </div>

    <div class="content__section">
      <h2>Step 3 — Your first measurement</h2>
      <p>Copy this into your project (or a CDN-import script tag) and run it. The expected output is in the comments — you can verify without even running it:</p>
      <pre><code>import { prepare, layout } from '@chenglou/pretext'

await document.fonts.ready

// prepare() measures the glyphs once (the expensive-ish part, ~1ms)
const prepared = prepare('Hello, world!', '16px Inter')

// layout() is pure arithmetic: max width 200px, line height 24px
console.log(layout(prepared, 200, 24))
// { lineCount: 1, height: 24 }   — fits on one line

// Same prepared text, narrower container — no re-measuring:
console.log(layout(prepared, 60, 24))
// { lineCount: 2, height: 48 }   — wraps to two lines</code></pre>
      <p><span class="api-tag">layout()</span> returns two numbers: <code>lineCount</code>, how many lines the text wraps to, and <code>height</code>, the total pixel height (<code>lineCount × lineHeight</code>). That's the pattern for everything pretext does: <strong>prepare once, layout as many times as you like</strong> — each <code>layout()</code> call costs ~0.01ms, which is why demos on this site can run it inside animation frames.</p>
      <div class="demo-area" style="margin-top:var(--space-4)">
        <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2)">Live result, computed on this page right now:</p>
        <div id="minimal-result" style="font-family:var(--font-code);font-size:var(--text-sm);color:var(--color-accent)"></div>
      </div>
    </div>

    <div class="content__section">
      <h2>Try it — interactive sandbox</h2>
      <p>Before the next step, get a feel for the two functions. Edit the text and drag the width — every change re-runs <span class="api-tag">prepare()</span> and <span class="api-tag">layout()</span> and shows you the timings.</p>
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
      <h2>Step 4 — Render wrapped lines yourself</h2>
      <p><code>layout()</code> tells you <em>how big</em> text will be. When you need the actual lines — to draw on a canvas, animate per-line, or build custom layout — use the second pair of functions: <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutWithLines()</span>. Here's a complete example that wraps a paragraph at 320px and renders each predicted line as its own element:</p>
      <pre><code>import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

await document.fonts.ready

const text =
  'Pretext measures and lays out multiline text without ' +
  'ever touching the DOM, using pure arithmetic.'

const prepared = prepareWithSegments(text, '16px Inter')
const { lines, lineCount, height } = layoutWithLines(prepared, 320, 24)

console.log(lineCount, height) // 3 72

const box = document.getElementById('output')
box.style.cssText = 'width:320px;font:16px Inter;line-height:24px'
for (const line of lines) {
  const div = document.createElement('div')
  div.textContent = line.text   // line.width has its exact pixel width
  box.appendChild(div)
}</code></pre>
      <p><strong>What you should see</strong> — three lines, 72px total, each line's measured width under the 320px limit (widths from Chrome; other browsers may differ by fractions of a pixel):</p>
      <pre><code>"Pretext measures and lays out multiline "   → 296px
"text without ever touching the DOM, using " → 318px
"pure arithmetic."                           → 119px</code></pre>
      <p>Note what just happened: pretext decided the line breaks — the browser never wrapped anything. Each <code>LayoutLine</code> gives you <code>text</code>, <code>width</code>, and start/end cursors, which is exactly what you need to draw text anywhere. The <a href="/pages/canvas.html">Canvas Rendering demo</a> uses this same output with <code>ctx.fillText()</code>.</p>
      <div class="demo-area" style="margin-top:var(--space-4)">
        <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2)">Live result — the code above, running on this page:</p>
        <div id="task-output" style="width:320px;max-width:100%;font:${FONT};line-height:${LINE_HEIGHT}px;border:1px dashed var(--color-border);padding:var(--space-2)"></div>
        <div id="task-stats" style="font-family:var(--font-code);font-size:var(--text-sm);color:var(--color-accent);margin-top:var(--space-2)"></div>
      </div>
    </div>

    <div class="content__section">
      <h2>Where next</h2>
      <div class="explanation">
        <p>You now know the whole core API. Each demo on this site is a working implementation with annotated source — pick one by what you want to learn:</p>
        <ul style="margin:var(--space-3) 0;display:flex;flex-direction:column;gap:var(--space-2);padding-left:var(--space-4)">
          <li><a href="/pages/accordion.html">Accordion</a> — animate an element to a height you <em>predicted</em> with <code>layout()</code>, instead of measuring the DOM mid-animation.</li>
          <li><a href="/pages/balanced-text.html">Balanced Text</a> — binary-search over widths with <code>layout()</code> to eliminate ragged last lines; a cross-browser <code>text-wrap: balance</code>.</li>
          <li><a href="/pages/virtualized.html">Virtualized Lists</a> — predict heights for 10,000 variable-height items so a scroll virtualizer never has to render-and-measure.</li>
          <li><a href="/pages/canvas.html">Canvas Rendering</a> — take Step 4's <code>layoutWithLines()</code> output and draw it with <code>ctx.fillText()</code>, with pan and zoom.</li>
        </ul>
        <p>For every function signature — including <code>walkLineRanges()</code> and <code>layoutNextLine()</code> for variable-width lines — see the <a href="/pages/api-reference.html">API Reference</a>.</p>
      </div>
    </div>
  `

  // Step 3 live result — the exact calls from the snippet
  const minimalPrepared = prepare('Hello, world!', FONT)
  const wide = layout(minimalPrepared, 200, LINE_HEIGHT)
  const narrow = layout(minimalPrepared, 60, LINE_HEIGHT)
  document.getElementById('minimal-result')!.textContent =
    `layout(prepared, 200, 24) → { lineCount: ${wide.lineCount}, height: ${wide.height} }   ` +
    `layout(prepared, 60, 24) → { lineCount: ${narrow.lineCount}, height: ${narrow.height} }`

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

  // Step 4 live result — the exact code from the snippet
  const taskPrepared = prepareWithSegments(TASK_TEXT, FONT)
  const taskResult = layoutWithLines(taskPrepared, 320, LINE_HEIGHT)
  const taskOutput = document.getElementById('task-output')!
  for (const line of taskResult.lines) {
    const div = document.createElement('div')
    div.textContent = line.text
    taskOutput.appendChild(div)
  }
  document.getElementById('task-stats')!.textContent =
    `lineCount: ${taskResult.lineCount}, height: ${taskResult.height}px — widths: ${taskResult.lines.map(l => `${Math.round(l.width)}px`).join(', ')}`
}

init()
