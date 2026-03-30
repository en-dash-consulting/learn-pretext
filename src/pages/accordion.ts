import { prepare, layout } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createToggle } from '../components/toggle'
import { createPerfMeter } from '../components/performance-meter'

const SECTIONS = [
  {
    title: 'What is Pretext?',
    text: 'Pretext is a JavaScript library that measures and lays out multiline text without ever touching the DOM. It uses pure arithmetic over cached glyph widths to compute line counts and heights. This makes resize-driven relayout essentially free compared to traditional DOM measurement.',
  },
  {
    title: 'How does it work?',
    text: 'The library works in two phases. First, prepare() analyzes and measures text segments using a canvas context, caching the glyph widths. Second, layout() uses those cached widths to compute line breaks with the same algorithm the browser uses. Because the expensive measurement only happens once, subsequent layout calls at different widths cost nearly nothing. The prepare step typically takes 0.1-0.5ms, while layout takes 0.01-0.05ms.',
  },
  {
    title: 'When should I use it?',
    text: 'Pretext is ideal whenever you need to know text dimensions before rendering. Common use cases include virtual scrolling with variable-height items, masonry layouts, chat bubble shrink-wrapping, accordion animations, and any interactive feature that needs text measurement at 60fps. If you only need to measure one static block of text once, DOM measurement is fine.',
  },
  {
    title: 'Browser compatibility',
    text: 'Pretext works in all modern browsers that support the Canvas API and Intl.Segmenter (Chrome 94+, Edge 94+, Safari 15.4+, Firefox 125+). It uses OffscreenCanvas when available for measurement. The library automatically detects browser-specific layout quirks and adjusts its algorithm accordingly, so results match the browser\'s native text rendering. It handles CJK text, emoji, bidirectional text, soft hyphens, and more.',
  },
  {
    title: 'Performance characteristics',
    text: 'On a modern laptop, prepare() processes typical English text at around 0.1ms per paragraph. The layout() call is even faster, typically under 0.01ms. This means you can measure 10,000 text items in about 100ms for prepare (done once) and under 1ms for layout (done on every resize). Compare this to DOM measurement, which costs 1-40ms per element due to forced reflows.',
  },
  {
    title: 'API overview',
    text: 'The core API consists of prepare() and layout() for simple height prediction, prepareWithSegments() and layoutWithLines() for getting per-line text and widths, walkLineRanges() for iterating over line ranges without allocating line objects, and layoutNextLine() for building lines one at a time with per-line variable widths. There is also setLocale() for configuring text segmentation rules and clearCache() for releasing cached glyph measurements.',
  },
]

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  const preparedSections = SECTIONS.map(s => ({
    ...s,
    prepared: prepare(s.text, FONT),
  }))

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Accordion</h1>
      <p class="content__subtitle">Smooth height animations powered by <span class="api-tag">prepare()</span> + <span class="api-tag">layout()</span> — no DOM measurement needed.</p>
    </div>

    <div class="content__section">
      <h2>Interactive Demo</h2>
      <p>Click any section to expand it. Pretext predicts the content height before the animation begins, so the CSS transition is smooth and exact.</p>
      <div style="display:flex;gap:var(--space-4);align-items:center;margin:var(--space-4) 0">
        <div id="mode-toggle"></div>
        <button id="toggle-all-btn" style="padding:var(--space-2) var(--space-4);background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);color:var(--color-text);cursor:pointer;font-size:var(--text-sm)">Toggle All Rapidly (5x)</button>
      </div>
      <div id="perf-area" style="margin-bottom:var(--space-4)"></div>
      <div class="demo-area" id="accordion-container"></div>
      <div id="accordion-source" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <div class="explanation">
        <h3>How It Works</h3>
        <p>Traditional accordion animations face a dilemma: CSS transitions need a concrete pixel value for <code>max-height</code>, but you don't know the content height until it's rendered. The typical workaround is to briefly render the content invisibly, read its offsetHeight, then animate — causing layout thrashing.</p>
        <p>With Pretext, we skip the DOM entirely. We call <code>layout(prepared, containerWidth, lineHeight)</code> to get the exact pixel height, then set that as the <code>max-height</code> for the transition. No hidden renders, no forced reflows.</p>
        <div class="key-insight">
          Pretext predicts the height in ~0.01ms. DOM measurement of a hidden element costs 1-5ms. When rapidly toggling sections, that difference becomes visible jank.
        </div>
      </div>
    </div>
  `

  const container = document.getElementById('accordion-container')!
  const perfMeter = createPerfMeter(document.getElementById('perf-area')!)
  let usePretext = true

  createToggle(document.getElementById('mode-toggle')!, {
    label: 'Without Pretext (DOM measurement)',
    active: false,
    onChange: (active) => { usePretext = !active },
  })

  // Build accordion HTML
  const accordionPadding = 24 // var(--space-6) = 24px on each side
  const accordionItems: { header: HTMLElement; body: HTMLElement; open: boolean; index: number }[] = []

  preparedSections.forEach((section, i) => {
    const item = document.createElement('div')
    item.style.cssText = 'border:1px solid var(--color-border);border-radius:var(--radius-md);margin-bottom:var(--space-2);overflow:hidden;'

    const header = document.createElement('button')
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;width:100%;padding:var(--space-3) var(--space-4);background:var(--color-bg-surface);border:none;color:var(--color-text);cursor:pointer;font-size:var(--text-base);font-weight:500;text-align:left;'
    header.innerHTML = `<span>${section.title}</span><span style="transition:transform 200ms ease;display:inline-block">&#9654;</span>`

    const body = document.createElement('div')
    body.style.cssText = 'max-height:0;overflow:hidden;transition:max-height 300ms cubic-bezier(0.16,1,0.3,1);'

    const inner = document.createElement('div')
    inner.style.cssText = `padding:var(--space-4) var(--space-4);font:${FONT};line-height:${LINE_HEIGHT}px;color:var(--color-text-secondary);`
    inner.textContent = section.text

    body.appendChild(inner)
    item.appendChild(header)
    item.appendChild(body)
    container.appendChild(item)

    const state = { header, body, open: false, index: i }
    accordionItems.push(state)

    header.addEventListener('click', () => toggleItem(state))
  })

  function toggleItem(item: typeof accordionItems[0]) {
    const section = preparedSections[item.index]!
    const arrow = item.header.querySelector('span:last-child') as HTMLElement

    if (item.open) {
      item.body.style.maxHeight = '0'
      arrow.style.transform = 'rotate(0deg)'
      item.open = false
      return
    }

    // Measure height
    let height: number
    let elapsed: number

    if (usePretext) {
      const bodyWidth = container.clientWidth - accordionPadding * 2 - 2 // border
      const timed = timeExecution(() => layout(section.prepared, bodyWidth, LINE_HEIGHT))
      height = timed.result.height + accordionPadding // padding top+bottom
      elapsed = timed.elapsed
    } else {
      // DOM measurement approach — hidden offscreen div
      const timed = timeExecution(() => {
        const measure = document.createElement('div')
        measure.style.cssText = `position:absolute;top:-9999px;left:-9999px;width:${container.clientWidth - 2}px;padding:var(--space-4);font:${FONT};line-height:${LINE_HEIGHT}px;white-space:normal;word-wrap:break-word;`
        measure.textContent = section.text
        document.body.appendChild(measure)
        const h = measure.offsetHeight
        document.body.removeChild(measure)
        return h
      })
      height = timed.result
      elapsed = timed.elapsed
    }

    item.body.style.maxHeight = `${height}px`
    arrow.style.transform = 'rotate(90deg)'
    item.open = true

    perfMeter.update([
      { label: usePretext ? 'Pretext' : 'DOM', value: elapsed, slow: !usePretext },
      { label: 'Predicted height', value: height },
    ])
  }

  // Toggle all rapidly button
  document.getElementById('toggle-all-btn')!.addEventListener('click', () => {
    let round = 0
    const maxRounds = 10 // 5 open + 5 close
    function doRound() {
      if (round >= maxRounds) return
      accordionItems.forEach(item => toggleItem(item))
      round++
      requestAnimationFrame(doRound)
    }
    doRound()
  })

  const sourceCode = `import { prepare, layout } from '@chenglou/pretext'

// Prepare text once
const prepared = prepare(sectionText, '16px Inter')

// On click: predict height, then animate
function toggleSection(el, bodyEl, prepared) {
  const width = el.clientWidth - padding
  const { height } = layout(prepared, width, 24)

  // Set the exact pixel height for CSS transition
  bodyEl.style.maxHeight = isOpen ? '0' : \`\${height}px\`
  bodyEl.style.transition = 'max-height 300ms ease'
}

// No hidden divs, no offsetHeight, no layout thrashing!`

  await createSourceViewer(document.getElementById('accordion-source')!, {
    code: sourceCode,
    title: 'Accordion Implementation',
  })
}

init()
