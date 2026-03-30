import { prepareWithSegments, walkLineRanges, layout } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createToggle } from '../components/toggle'
import { createSlider } from '../components/slider'
import { createPerfMeter } from '../components/performance-meter'

const SAMPLE_TEXTS = [
  'Pretext measures and lays out multiline text without ever touching the DOM, using pure arithmetic.',
  'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
  'This headline is designed to demonstrate how balanced text wrapping creates a more harmonious visual appearance than the default behavior.',
  'Sometimes the last line of a paragraph has only one or two orphaned words sitting alone, which looks awkward.',
  'A great typographic tool helps designers craft beautiful, readable layouts by understanding how text flows and breaks across lines.',
]

function findBalancedWidth(
  prepared: ReturnType<typeof prepareWithSegments>,
  maxWidth: number,
  lineHeight: number,
): number {
  const normalResult = layout(prepared, maxWidth, lineHeight)
  const targetLineCount = normalResult.lineCount

  if (targetLineCount <= 1) return maxWidth

  // Binary search for the narrowest width that keeps the same line count
  let lo = 0
  let hi = maxWidth

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    const result = layout(prepared, mid, lineHeight)
    if (result.lineCount <= targetLineCount) {
      hi = mid
    } else {
      lo = mid
    }
  }

  return hi
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Balanced Text</h1>
      <p class="content__subtitle">Binary search for optimal text width using <span class="api-tag">walkLineRanges()</span> — no extra lines, minimal width.</p>
    </div>

    <div class="content__section">
      <h2>Interactive Demo</h2>
      <p>Toggle between normal wrapping and balanced wrapping. The balanced mode finds the narrowest container width that keeps the same number of lines — distributing text more evenly across lines.</p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-4);align-items:center;margin:var(--space-4) 0">
        <div id="balance-toggle"></div>
        <div id="width-slider" style="min-width:250px;flex:1"></div>
      </div>
      <div id="balance-perf" style="margin-bottom:var(--space-4)"></div>
      <div id="text-selector" style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-4)">
      </div>
      <div class="demo-area" id="demo-area">
        <div id="text-display" style="font:${FONT};line-height:${LINE_HEIGHT}px;margin:0 auto;border:1px dashed var(--color-border);padding:var(--space-3);transition:width 300ms cubic-bezier(0.16,1,0.3,1);"></div>
        <div id="width-info" style="text-align:center;margin-top:var(--space-3);font-size:var(--text-sm);font-family:var(--font-code);color:var(--color-text-tertiary)"></div>
      </div>
      <div id="balance-source" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <div class="explanation">
        <h3>How It Works</h3>
        <p>The algorithm performs a binary search over container widths. For each candidate width, it calls <code>layout()</code> to check the line count. If the line count equals the target (line count at full width), the width is viable — try narrower. If the line count increases, the width is too narrow — try wider.</p>
        <p>Because <code>layout()</code> costs ~0.01ms, the entire binary search (about 10 iterations for pixel precision) takes well under 1ms.</p>
        <div class="key-insight">CSS <code>text-wrap: balance</code> only works for blocks up to 6 lines in Chrome and has inconsistent cross-browser support. This pretext approach works for any length, any font, any width, in every browser.</div>
      </div>
    </div>
  `

  let currentTextIndex = 0
  let isBalanced = false
  let containerWidth = 500
  const textDisplay = document.getElementById('text-display')!
  const widthInfo = document.getElementById('width-info')!
  const perfMeter = createPerfMeter(document.getElementById('balance-perf')!)

  // Text selector buttons
  const selectorContainer = document.getElementById('text-selector')!
  SAMPLE_TEXTS.forEach((_, i) => {
    const btn = document.createElement('button')
    btn.style.cssText = `padding:var(--space-1) var(--space-3);background:${i === 0 ? 'var(--color-accent)' : 'var(--color-bg-surface)'};color:${i === 0 ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'};border:1px solid var(--color-border);border-radius:var(--radius-sm);cursor:pointer;font-size:var(--text-sm);`
    btn.textContent = `Text ${i + 1}`
    btn.addEventListener('click', () => {
      currentTextIndex = i
      selectorContainer.querySelectorAll('button').forEach((b, j) => {
        ;(b as HTMLElement).style.background = j === i ? 'var(--color-accent)' : 'var(--color-bg-surface)'
        ;(b as HTMLElement).style.color = j === i ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'
      })
      update()
    })
    selectorContainer.appendChild(btn)
  })

  createToggle(document.getElementById('balance-toggle')!, {
    label: 'Balanced',
    active: false,
    onChange: (active) => {
      isBalanced = active
      update()
    },
  })

  createSlider(document.getElementById('width-slider')!, {
    label: 'Container Width',
    min: 200,
    max: 700,
    value: 500,
    step: 5,
    formatValue: v => `${v}px`,
    onChange: v => {
      containerWidth = v
      update()
    },
  })

  function update() {
    const text = SAMPLE_TEXTS[currentTextIndex]!
    const prepared = prepareWithSegments(text, FONT)

    let displayWidth: number
    let balancedWidth: number | null = null
    let searchElapsed = 0

    if (isBalanced) {
      const timed = timeExecution(() => findBalancedWidth(prepared, containerWidth, LINE_HEIGHT))
      balancedWidth = timed.result
      searchElapsed = timed.elapsed
      displayWidth = balancedWidth
    } else {
      displayWidth = containerWidth
    }

    textDisplay.style.width = `${displayWidth}px`
    textDisplay.textContent = text

    // Get line details
    const lines: number[] = []
    walkLineRanges(prepared, displayWidth, (line) => {
      lines.push(line.width)
    })

    const normalResult = layout(prepared, containerWidth, LINE_HEIGHT)

    if (isBalanced && balancedWidth !== null) {
      const saved = containerWidth - balancedWidth
      widthInfo.innerHTML = `
        Normal: ${containerWidth}px | Balanced: ${balancedWidth}px | Saved: <span style="color:var(--color-success)">${saved}px</span> | Lines: ${lines.length}
      `
      perfMeter.update([
        { label: 'Binary search', value: searchElapsed },
        { label: 'Width saved', value: saved },
      ])
    } else {
      widthInfo.textContent = `Width: ${containerWidth}px | Lines: ${normalResult.lineCount}`
      perfMeter.update([
        { label: 'Lines', value: normalResult.lineCount },
        { label: 'Height', value: normalResult.height },
      ])
    }
  }

  update()

  const sourceCode = `import { prepareWithSegments, layout } from '@chenglou/pretext'

function findBalancedWidth(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  lineHeight: number,
): number {
  const { lineCount: targetLineCount } = layout(prepared, maxWidth, lineHeight)
  if (targetLineCount <= 1) return maxWidth

  // Binary search: narrowest width that keeps the same line count
  let lo = 0
  let hi = maxWidth

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    const { lineCount } = layout(prepared, mid, lineHeight)

    if (lineCount <= targetLineCount) {
      hi = mid  // This width works — try narrower
    } else {
      lo = mid  // Too narrow — try wider
    }
  }

  return hi
}

// Usage: ~10 iterations of layout() = ~0.1ms total
const balanced = findBalancedWidth(prepared, 500, 24)
element.style.width = \`\${balanced}px\``

  await createSourceViewer(document.getElementById('balance-source')!, {
    code: sourceCode,
    title: 'Binary Search Algorithm',
  })
}

init()
