import { prepare, layout } from '@chenglou/pretext'
import type { PreparedText } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution, onResize } from '../shared/pretext-helpers'
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

const rng = seededRandom(42)

interface Card {
  text: string
  prepared: PreparedText
  hue: number
}

const CARDS: Card[] = Array.from({ length: 60 }, () => {
  const sentenceCount = Math.floor(rng() * 5) + 1
  const sentences: string[] = []
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(SENTENCES[Math.floor(rng() * SENTENCES.length)]!)
  }
  return {
    text: sentences.join(' '),
    prepared: null as unknown as PreparedText,
    hue: Math.floor(rng() * 360),
  }
})

const CARD_PADDING = 32 // 16px each side
const CARD_TITLE_HEIGHT = 36 // approx title + gap
const GAP = 12

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  // Prepare all texts
  CARDS.forEach(card => {
    card.prepared = prepare(card.text, FONT)
  })

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Masonry Layout</h1>
      <p class="content__subtitle">60 cards laid out with <span class="api-tag">prepare()</span> + <span class="api-tag">layout()</span> — heights predicted without rendering.</p>
    </div>

    <div class="content__section">
      <h2>Demo</h2>
      <p>Resize your browser to see the layout reflow. Column count adapts responsively: 1 column below 480px, 2 below 768px, 3 below 1024px, 4 at 1024px and above. All heights are predicted with pretext — no DOM measurement.</p>
      <div id="masonry-perf" style="margin:var(--space-4) 0"></div>
      <div class="demo-area demo-area--full" id="masonry-wrapper" style="position:relative;overflow:hidden;min-height:200px;">
        <div id="masonry-container" style="position:relative;width:100%;"></div>
      </div>
      <div id="masonry-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const container = document.getElementById('masonry-container')!
  const wrapper = document.getElementById('masonry-wrapper')!
  const perfMeter = createPerfMeter(document.getElementById('masonry-perf')!)

  // Create card elements
  const cardElements: HTMLElement[] = CARDS.map((card, i) => {
    const el = document.createElement('div')
    el.style.cssText = `
      position:absolute;
      background:var(--color-bg-surface);
      border:1px solid var(--color-border);
      border-radius:var(--radius-md);
      padding:var(--space-4);
      transition:transform 300ms cubic-bezier(0.16,1,0.3,1), opacity 300ms ease;
      overflow:hidden;
    `
    el.innerHTML = `
      <div style="font-size:var(--text-xs);font-weight:600;color:hsl(${card.hue},60%,65%);margin-bottom:var(--space-2)">Card ${i + 1}</div>
      <div style="font:${FONT};line-height:${LINE_HEIGHT}px;color:var(--color-text-secondary)">${card.text}</div>
    `
    container.appendChild(el)
    return el
  })

  function getColumnCount(width: number): number {
    if (width < 480) return 1
    if (width < 768) return 2
    if (width < 1024) return 3
    return 4
  }

  function doLayout() {
    const containerWidth = wrapper.clientWidth
    const cols = getColumnCount(containerWidth)
    const colWidth = (containerWidth - GAP * (cols - 1)) / cols

    const textWidth = colWidth - CARD_PADDING - 2 // subtract padding + border

    const { elapsed } = timeExecution(() => {
      const colHeights = new Array(cols).fill(0)

      CARDS.forEach((card, i) => {
        const { height: textHeight } = layout(card.prepared, textWidth, LINE_HEIGHT)
        const cardHeight = textHeight + CARD_TITLE_HEIGHT + CARD_PADDING

        // Find shortest column
        let shortestCol = 0
        for (let c = 1; c < cols; c++) {
          if (colHeights[c]! < colHeights[shortestCol]!) shortestCol = c
        }

        const x = shortestCol * (colWidth + GAP)
        const y = colHeights[shortestCol]!

        const el = cardElements[i]!
        el.style.width = `${colWidth}px`
        el.style.transform = `translate(${x}px, ${y}px)`

        colHeights[shortestCol] = y + cardHeight + GAP
      })

      // Set container height
      const maxHeight = Math.max(...colHeights)
      container.style.height = `${maxHeight}px`
    })

    perfMeter.update([
      { label: `${CARDS.length} cards`, value: elapsed },
      { label: `${cols} columns`, value: containerWidth },
    ])
  }

  doLayout()
  onResize(wrapper, () => doLayout())

  const sourceCode = `import { prepare, layout } from '@chenglou/pretext'

// Prepare all 60 cards once
const cards = texts.map(text => ({
  text,
  prepared: prepare(text, '16px Inter'),
}))

function doMasonryLayout(containerWidth: number) {
  const cols = getColumnCount(containerWidth)
  const colWidth = (containerWidth - GAP * (cols - 1)) / cols
  const colHeights = new Array(cols).fill(0)

  cards.forEach((card, i) => {
    // Predict height without DOM measurement
    const { height } = layout(card.prepared, colWidth - padding, 24)
    const cardHeight = height + titleHeight + padding

    // Place in shortest column
    const shortestCol = colHeights.indexOf(Math.min(...colHeights))
    const x = shortestCol * (colWidth + GAP)
    const y = colHeights[shortestCol]

    elements[i].style.transform = \`translate(\${x}px, \${y}px)\`
    elements[i].style.width = \`\${colWidth}px\`
    colHeights[shortestCol] += cardHeight + GAP
  })
}

// Re-layout on every resize — fast enough at ~0.1ms total
const observer = new ResizeObserver(() => doMasonryLayout(container.clientWidth))
observer.observe(container)`

  await createSourceViewer(document.getElementById('masonry-source')!, {
    code: sourceCode,
    title: 'Masonry Layout Implementation',
  })
}

init()
