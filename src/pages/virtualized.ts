import { prepare, layout } from '@chenglou/pretext'
import type { PreparedText } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createPerfMeter } from '../components/performance-meter'

const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'How vexingly quick daft zebras jump!',
  'Sphinx of black quartz, judge my vow.',
  'Two driven jocks help fax my big quiz.',
  'The five boxing wizards jump quickly at dawn.',
  'Amazingly few discotheques provide jukeboxes.',
  'My girl wove six dozen plaid jackets before she quit.',
  'We promptly judged antique ivory buckles for the next prize.',
  'Sixty zippers were quickly picked from the woven jute bag.',
  'A quick movement of the enemy will jeopardize six gunboats.',
  'All questions asked by five watched experts amaze the judge.',
  'Crazy Frederick bought many very exquisite opal jewels.',
  'Jack quietly moved up front and seized the big ball of wax.',
  'Grumpy wizards make toxic brew for the evil queen and jack.',
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const rng = seededRandom(99)
const TOTAL_ITEMS = 10000
const ITEM_PADDING = 24 // 12px top + 12px bottom
const BUFFER = 5

interface Item {
  text: string
  prepared: PreparedText
  height: number
  top: number
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Virtualized List</h1>
      <p class="content__subtitle">10,000 variable-height items — heights predicted with <span class="api-tag">prepare()</span> + <span class="api-tag">layout()</span>, no DOM measurement.</p>
    </div>

    <div class="content__section">
      <h2>Demo</h2>
      <p>Scroll through 10,000 items. Only items in the viewport (plus a buffer) are rendered. Heights were predicted by pretext in a single batch — no hidden DOM elements needed.</p>
      <div id="virtual-perf" style="margin-bottom:var(--space-4)"></div>
      <div id="virtual-stats" style="display:flex;gap:var(--space-4);margin-bottom:var(--space-4);font-size:var(--text-sm);font-family:var(--font-code);color:var(--color-text-secondary);flex-wrap:wrap;"></div>
      <div class="demo-area demo-area--full" style="height:500px;position:relative;overflow:hidden;" id="virtual-wrapper">
        <div id="virtual-scroll" style="height:100%;overflow-y:auto;position:relative;">
          <div id="virtual-spacer" style="position:relative;width:100%;">
            <div id="virtual-items"></div>
          </div>
        </div>
      </div>
      <div id="virtual-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const perfMeter = createPerfMeter(document.getElementById('virtual-perf')!)
  const statsEl = document.getElementById('virtual-stats')!
  const scrollEl = document.getElementById('virtual-scroll')!
  const spacerEl = document.getElementById('virtual-spacer')!
  const itemsEl = document.getElementById('virtual-items')!
  const wrapper = document.getElementById('virtual-wrapper')!

  // Generate items
  const texts: string[] = []
  for (let i = 0; i < TOTAL_ITEMS; i++) {
    const sentenceCount = Math.floor(rng() * 4) + 1
    const sentences: string[] = []
    for (let j = 0; j < sentenceCount; j++) {
      sentences.push(SENTENCES[Math.floor(rng() * SENTENCES.length)]!)
    }
    texts.push(sentences.join(' '))
  }

  // Prepare all texts
  const { elapsed: prepareTime } = timeExecution(() => {
    for (const text of texts) {
      prepare(text, FONT)
    }
  })

  // We need to wait for the container to have a width
  let containerWidth = wrapper.clientWidth - 2 // border
  if (containerWidth <= 0) containerWidth = 600
  const textWidth = containerWidth - ITEM_PADDING * 2

  // Layout all items to get heights
  const items: Item[] = []
  const { elapsed: layoutTime } = timeExecution(() => {
    let top = 0
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const p = prepare(texts[i]!, FONT)
      const result = layout(p, textWidth, LINE_HEIGHT)
      const height = result.height + ITEM_PADDING
      items.push({ text: texts[i]!, prepared: p, height, top })
      top += height
    }
  })

  const totalHeight = items.length > 0 ? items[items.length - 1]!.top + items[items.length - 1]!.height : 0
  spacerEl.style.height = `${totalHeight}px`

  // FPS counter
  let frameCount = 0
  let lastFpsTime = performance.now()
  let fps = 0

  function updateFps() {
    frameCount++
    const now = performance.now()
    if (now - lastFpsTime >= 1000) {
      fps = Math.round(frameCount * 1000 / (now - lastFpsTime))
      frameCount = 0
      lastFpsTime = now
    }
  }

  // Pool of reusable DOM elements
  const pool: HTMLElement[] = []
  const activeElements = new Map<number, HTMLElement>()

  function getElement(): HTMLElement {
    if (pool.length > 0) return pool.pop()!
    const el = document.createElement('div')
    el.style.cssText = `
      position:absolute;left:0;right:0;
      padding:var(--space-3) var(--space-4);
      border-bottom:1px solid var(--color-border-subtle);
      font:${FONT};line-height:${LINE_HEIGHT}px;
      color:var(--color-text-secondary);
      box-sizing:border-box;
    `
    return el
  }

  function releaseElement(el: HTMLElement) {
    el.style.display = 'none'
    pool.push(el)
  }

  // Binary search for the first visible item
  function findFirstVisible(scrollTop: number): number {
    let lo = 0
    let hi = items.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (items[mid]!.top + items[mid]!.height <= scrollTop) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    return lo
  }

  let renderedCount = 0

  function renderVisible() {
    updateFps()

    const scrollTop = scrollEl.scrollTop
    const viewportHeight = scrollEl.clientHeight

    const firstIdx = Math.max(0, findFirstVisible(scrollTop) - BUFFER)
    const lastVisibleTop = scrollTop + viewportHeight

    let lastIdx = firstIdx
    while (lastIdx < items.length && items[lastIdx]!.top < lastVisibleTop) {
      lastIdx++
    }
    lastIdx = Math.min(items.length - 1, lastIdx + BUFFER)

    // Remove elements that are no longer visible
    for (const [idx, el] of activeElements) {
      if (idx < firstIdx || idx > lastIdx) {
        releaseElement(el)
        activeElements.delete(idx)
      }
    }

    // Add elements that are newly visible
    for (let i = firstIdx; i <= lastIdx; i++) {
      if (activeElements.has(i)) continue

      const item = items[i]!
      const el = getElement()
      el.style.display = ''
      el.style.top = `${item.top}px`
      el.style.height = `${item.height}px`
      el.innerHTML = `<span style="color:var(--color-text-tertiary);font-size:var(--text-xs);font-family:var(--font-code);margin-right:var(--space-2)">#${i + 1}</span>${escapeHtml(item.text)}`

      if (!el.parentNode) {
        itemsEl.appendChild(el)
      }

      activeElements.set(i, el)
    }

    renderedCount = activeElements.size

    statsEl.innerHTML = `
      <span>Total: <span style="color:var(--color-accent)">${TOTAL_ITEMS.toLocaleString()}</span></span>
      <span>Rendered: <span style="color:var(--color-success)">${renderedCount}</span></span>
      <span>FPS: <span style="color:${fps >= 55 ? 'var(--color-success)' : fps >= 30 ? 'var(--color-warning)' : 'var(--color-error)'}">${fps}</span></span>
      <span>Scroll: <span style="color:var(--color-text-tertiary)">${Math.round(scrollTop)}px</span></span>
    `
  }

  perfMeter.update([
    { label: `Prepare ${TOTAL_ITEMS.toLocaleString()}`, value: prepareTime },
    { label: `Layout ${TOTAL_ITEMS.toLocaleString()}`, value: layoutTime },
    { label: 'Total height', value: totalHeight },
  ])

  scrollEl.addEventListener('scroll', () => requestAnimationFrame(renderVisible), { passive: true })
  renderVisible()

  // FPS measurement loop
  function fpsLoop() {
    updateFps()
    requestAnimationFrame(fpsLoop)
  }
  requestAnimationFrame(fpsLoop)

  const sourceCode = `import { prepare, layout } from '@chenglou/pretext'

const TOTAL = 10_000
const items: Item[] = []

// Step 1: Prepare all texts (done once)
const prepared = texts.map(t => prepare(t, '16px Inter'))

// Step 2: Layout all to get heights (no DOM needed!)
let top = 0
for (let i = 0; i < TOTAL; i++) {
  const { height } = layout(prepared[i], containerWidth, 24)
  items.push({ text: texts[i], height: height + padding, top })
  top += items[i].height
}

// Step 3: Set scroll container height
spacer.style.height = \`\${top}px\`

// Step 4: On scroll, render only visible items
function renderVisible() {
  const first = binarySearch(items, scrollTop)
  const last = findLastVisible(items, scrollTop + viewportHeight)

  for (let i = first; i <= last; i++) {
    const el = getOrCreateElement(i)
    el.style.top = \`\${items[i].top}px\`
    el.style.height = \`\${items[i].height}px\`
    el.textContent = items[i].text
  }
}

// 10,000 heights computed in ~5ms — no hidden divs needed`

  await createSourceViewer(document.getElementById('virtual-source')!, {
    code: sourceCode,
    title: 'Virtual Scroll Implementation',
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
