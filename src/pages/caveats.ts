import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Caveats & Recipes</h1>
      <p class="content__subtitle">Known limitations, common gotchas, and ready-to-use code recipes.</p>
    </div>

    <div class="content__section">
      <h2>Caveats</h2>

      <div class="explanation">
        <h3>The system-ui Font Issue</h3>
        <p>The font string <code>"16px system-ui"</code> resolves to different actual fonts on different operating systems: San Francisco on macOS, Segoe UI on Windows, Roboto on Android. Since pretext measures using the canvas API with the same font string, it will match your current browser — but measurements won't be portable across devices.</p>
        <div class="key-insight">For consistent cross-platform results, use a web font loaded via @font-face or a package like @fontsource. Example: <code>"16px Inter"</code> will produce identical measurements everywhere.</div>
      </div>

      <div class="explanation">
        <h3>Font String Matching Rules</h3>
        <p>The font string passed to <code>prepare()</code> must <strong>exactly match</strong> the CSS font shorthand the browser uses. Common mistakes:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm)">
          <li><code style="color:var(--color-error)">"16px 'Inter'"</code> — don't add quotes around the font name</li>
          <li><code style="color:var(--color-success)">"16px Inter"</code> — correct</li>
          <li><code style="color:var(--color-error)">"1rem Inter"</code> — don't use relative units, only px</li>
          <li><code style="color:var(--color-success)">"16px Inter"</code> — compute px value first</li>
          <li><code style="color:var(--color-error)">"bold 16px Inter"</code> — font weight is part of the shorthand</li>
          <li><code style="color:var(--color-success)">"bold 16px Inter"</code> — this is actually correct if your text is bold</li>
          <li><code style="color:var(--color-error)">"16px Inter, sans-serif"</code> — fallback fonts are part of the string</li>
          <li><code style="color:var(--color-success)">"16px Inter, sans-serif"</code> — this is fine if it matches your CSS</li>
        </ul>
        <p>The safest approach: read the computed style from a sample element:</p>
        <pre><code>const font = getComputedStyle(element).font
const prepared = prepare(text, font)</code></pre>
      </div>

      <div class="explanation">
        <h3>CSS Target Limitations</h3>
        <p>Pretext matches the browser's <code>white-space: normal</code> behavior (or <code>pre-wrap</code> with the option). It does <strong>not</strong> account for:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li>CSS text-indent</li>
          <li>CSS word-spacing or letter-spacing</li>
          <li>CSS text-wrap: balance or pretty</li>
          <li>CSS hyphens: auto (browser-driven hyphenation)</li>
          <li>CSS hanging-punctuation</li>
          <li>Flexbox/grid item sizing effects on text containers</li>
        </ul>
        <p>If your CSS uses any of these, pretext's measurements may differ from the rendered result. Keep your text container styled simply: <code>font</code>, <code>line-height</code>, <code>width</code>, and <code>word-wrap: break-word</code>.</p>
      </div>

      <div class="explanation">
        <h3>pre-wrap Mode</h3>
        <p>By default, pretext uses <code>white-space: normal</code> rules: multiple spaces collapse, newlines become spaces. To preserve whitespace like <code>white-space: pre-wrap</code>:</p>
        <pre><code>const prepared = prepare(text, font, { whiteSpace: 'pre-wrap' })</code></pre>
        <p>In pre-wrap mode, spaces are preserved and lines break at newlines as well as at the container width.</p>
      </div>

      <div class="explanation">
        <h3>Soft Hyphens</h3>
        <p>Pretext supports soft hyphens (<code>\\u00AD</code>). When a line break occurs at a soft hyphen, the hyphen character is rendered and its width is included in the line width. This matches browser behavior.</p>
        <p>Note: different browsers handle the edge case of soft hyphens differently (e.g., whether to prefer breaking at a soft hyphen vs. a space). Pretext detects the browser and adjusts accordingly.</p>
      </div>
    </div>

    <div class="content__section">
      <h2>Recipes</h2>
      <div id="recipe-resize"></div>
      <div id="recipe-react" style="margin-top:var(--space-4)"></div>
      <div id="recipe-animation" style="margin-top:var(--space-4)"></div>
      <div id="recipe-font-loading" style="margin-top:var(--space-4)"></div>
      <div id="recipe-virtual-scroll" style="margin-top:var(--space-4)"></div>
      <div id="recipe-shrink-wrap" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <h2>Live: Soft Hyphen Demo</h2>
      <p>The word "super\u00ADcalifragilistic\u00ADexpialidocious" has soft hyphens. Resize the container to see hyphenation in action.</p>
      <div class="demo-area" id="shy-demo" style="resize:horizontal;overflow:auto;min-width:100px;max-width:100%;">
        <div id="shy-text" style="font:${FONT};line-height:${LINE_HEIGHT}px;word-wrap:break-word;">super\u00ADcalifragilistic\u00ADexpialidocious is a super\u00ADcalifragilistic\u00ADexpialidocious word</div>
        <div id="shy-info" style="margin-top:var(--space-2);font-size:var(--text-xs);font-family:var(--font-code);color:var(--color-text-tertiary)"></div>
      </div>
    </div>
  `

  // Soft hyphen demo
  const shyText = 'super\u00ADcalifragilistic\u00ADexpialidocious is a super\u00ADcalifragilistic\u00ADexpialidocious word'
  const shyPrepared = prepareWithSegments(shyText, FONT)
  const shyDemo = document.getElementById('shy-demo')!
  const shyInfo = document.getElementById('shy-info')!

  function updateShyDemo() {
    const width = shyDemo.clientWidth - 48 // padding
    const result = layoutWithLines(shyPrepared, width, LINE_HEIGHT)
    shyInfo.textContent = `width: ${width}px | lines: ${result.lineCount} | ${result.lines.map((l, i) => `L${i + 1}: "${l.text}"`).join(' | ')}`
  }

  const shyObserver = new ResizeObserver(() => updateShyDemo())
  shyObserver.observe(shyDemo)
  updateShyDemo()

  // Recipe source viewers
  await Promise.all([
    createSourceViewer(document.getElementById('recipe-resize')!, {
      code: `// Recipe: Resize Handler
import { prepare, layout } from '@chenglou/pretext'

const prepared = prepare(text, '16px Inter')

const observer = new ResizeObserver(entries => {
  const width = entries[0].contentRect.width
  const { lineCount, height } = layout(prepared, width, 24)
  element.style.height = \`\${height}px\`
})
observer.observe(container)

// Cleanup
// observer.disconnect()`,
      title: 'Recipe: Resize Handler',
    }),

    createSourceViewer(document.getElementById('recipe-react')!, {
      code: `// Recipe: React Integration
import { prepare, layout } from '@chenglou/pretext'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'

function usePretextHeight(text: string, font: string, lineHeight: number) {
  const prepared = useMemo(() => prepare(text, font), [text, font])
  const [height, setHeight] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width
      const result = layout(prepared, width, lineHeight)
      setHeight(result.height)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [prepared, lineHeight])

  return { ref, height }
}

// Usage:
function TextBlock({ text }: { text: string }) {
  const { ref, height } = usePretextHeight(text, '16px Inter', 24)
  return <div ref={ref} style={{ height }}>{text}</div>
}`,
      title: 'Recipe: React Integration',
    }),

    createSourceViewer(document.getElementById('recipe-animation')!, {
      code: `// Recipe: Animation Loop with layoutNextLine
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '16px Inter')

function renderFrame(obstacles: Obstacle[]) {
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = 0

  while (y < containerHeight) {
    // Compute available width at this Y position
    const maxWidth = getAvailableWidth(y, obstacles, columnWidth)

    const line = layoutNextLine(prepared, cursor, maxWidth)
    if (!line) break

    ctx.fillText(line.text, leftMargin, y)
    cursor = line.end
    y += lineHeight
  }
}

let rafId: number
function animate() {
  updateObstacles() // move shapes
  renderFrame(obstacles)
  rafId = requestAnimationFrame(animate)
}
animate()`,
      title: 'Recipe: Animation Loop',
    }),

    createSourceViewer(document.getElementById('recipe-font-loading')!, {
      code: `// Recipe: Font Loading
import { prepare, clearCache } from '@chenglou/pretext'

// Method 1: Wait for CSS fonts
await document.fonts.ready
const prepared = prepare(text, '16px Inter')

// Method 2: Dynamic font loading
const font = new FontFace('CustomFont', 'url(/fonts/custom.woff2)')
await font.load()
document.fonts.add(font)
const prepared2 = prepare(text, '16px CustomFont')

// Method 3: Font swap detection
// If a font-display: swap might cause a change:
document.fonts.addEventListener('loadingdone', () => {
  clearCache() // Re-measure with new font
  // Re-prepare all active texts
  activeTexts.forEach(t => t.prepared = prepare(t.text, font))
  relayout()
})`,
      title: 'Recipe: Font Loading',
    }),

    createSourceViewer(document.getElementById('recipe-virtual-scroll')!, {
      code: `// Recipe: Virtual Scroll
import { prepare, layout } from '@chenglou/pretext'

// Step 1: Prepare and measure all items upfront
const items = data.map(item => {
  const prepared = prepare(item.text, '16px Inter')
  const { height } = layout(prepared, containerWidth, 24)
  return { ...item, prepared, height: height + padding }
})

// Step 2: Build position index
let totalHeight = 0
const positions = items.map(item => {
  const top = totalHeight
  totalHeight += item.height
  return { top, height: item.height }
})

// Step 3: On resize, re-layout all (still fast!)
function onResize(newWidth: number) {
  totalHeight = 0
  items.forEach((item, i) => {
    const { height } = layout(item.prepared, newWidth, 24)
    positions[i] = { top: totalHeight, height: height + padding }
    totalHeight += positions[i].height
  })
  spacer.style.height = \`\${totalHeight}px\`
  renderVisible()
}`,
      title: 'Recipe: Virtual Scroll',
    }),

    createSourceViewer(document.getElementById('recipe-shrink-wrap')!, {
      code: `// Recipe: Shrink-Wrap Container
import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'

function getShrinkWrapWidth(text: string, maxWidth: number): number {
  const prepared = prepareWithSegments(text, '16px Inter')
  let widestLine = 0

  walkLineRanges(prepared, maxWidth, (line) => {
    widestLine = Math.max(widestLine, line.width)
  })

  return Math.ceil(widestLine)
}

// Use it for chat bubbles, tooltips, labels, etc.
const bubbleWidth = getShrinkWrapWidth(message, 300) + padding
bubble.style.width = \`\${bubbleWidth}px\``,
      title: 'Recipe: Shrink-Wrap Container',
    }),
  ])
}

init()
