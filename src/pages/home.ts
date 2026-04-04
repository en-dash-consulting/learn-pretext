import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts } from '../shared/pretext-helpers'
import { tracks } from '../shared/nav-data'
import { getControlState, onControlChange } from '../shared/controls'
import type { InteractionMode } from '../shared/controls'

// --- All the text on the page, structured for layout ---

interface TextBlock {
  text: string
  font: (scale: number, mobile: boolean) => string
  lineHeight: (scale: number, mobile: boolean) => number
  align: 'left' | 'center'
  cssClass: string
  marginTop: (scale: number, mobile: boolean) => number
}

function heroFont(scale: number, mobile: boolean) {
  const size = Math.round((mobile ? 44 : 68) * scale)
  return `700 ${size}px Inter`
}

function h2Font(scale: number, mobile: boolean) {
  const size = Math.round((mobile ? 24 : 36) * scale)
  return `700 ${size}px Inter`
}

function bodyFont(scale: number) {
  const size = Math.round(16 * scale)
  return `400 ${size}px Inter`
}

function metricFont(scale: number, mobile: boolean) {
  const size = Math.round((mobile ? 36 : 52) * scale)
  return `700 ${size}px Inter`
}

function metricLabelFont(scale: number) {
  const size = Math.round(12 * scale)
  return `500 ${size}px Inter`
}

const BLOCKS: TextBlock[] = [
  {
    text: 'Learn Pretext',
    font: heroFont,
    lineHeight: (s, m) => Math.round((m ? 44 : 68) * s * 1.15),
    align: 'center',
    cssClass: 'portal-char--hero',
    marginTop: (s, m) => Math.round((m ? 80 : 120) * s),
  },
  {
    text: 'Every piece of text you have ever read on the web was measured by the browser. Every headline, every paragraph — the browser created an invisible element, forced a reflow, and threw it away. This happens so often we stopped noticing.',
    font: (s) => bodyFont(s),
    lineHeight: (s) => Math.round(16 * s * 1.65),
    align: 'left',
    cssClass: 'portal-char--body',
    marginTop: (s, m) => Math.round((m ? 40 : 60) * s),
  },
  {
    text: 'There is another way. Text layout is arithmetic. Given a font and a width, every line break can be computed through addition alone. No elements. No style recalculation. Just math.',
    font: (s) => bodyFont(s),
    lineHeight: (s) => Math.round(16 * s * 1.65),
    align: 'left',
    cssClass: 'portal-char--body',
    marginTop: (s) => Math.round(20 * s),
  },
  {
    text: 'The text you are reading was laid out this way. Move your cursor across these words and watch what happens.',
    font: (s) => bodyFont(s),
    lineHeight: (s) => Math.round(16 * s * 1.65),
    align: 'left',
    cssClass: 'portal-char--body',
    marginTop: (s) => Math.round(20 * s),
  },
  // Section: What is Pretext?
  {
    text: 'What is Pretext?',
    font: h2Font,
    lineHeight: (s, m) => Math.round((m ? 24 : 36) * s * 1.15),
    align: 'center',
    cssClass: 'portal-char--heading',
    marginTop: (s, m) => Math.round((m ? 100 : 160) * s),
  },
  {
    text: 'A JavaScript library that measures multiline text without touching the DOM. Pure arithmetic over cached glyph widths. Resize-driven relayout that costs virtually nothing.',
    font: (s) => bodyFont(s),
    lineHeight: (s) => Math.round(16 * s * 1.65),
    align: 'center',
    cssClass: 'portal-char--body',
    marginTop: (s) => Math.round(24 * s),
  },
  // Metrics row
  {
    text: '< 0.01ms',
    font: metricFont,
    lineHeight: (s, m) => Math.round((m ? 36 : 52) * s * 1.1),
    align: 'center',
    cssClass: 'portal-char--metric',
    marginTop: (s, m) => Math.round((m ? 60 : 80) * s),
  },
  {
    text: 'LAYOUT TIME',
    font: metricLabelFont,
    lineHeight: (s) => Math.round(12 * s * 1.6),
    align: 'center',
    cssClass: 'portal-char--metric-label',
    marginTop: (s) => Math.round(8 * s),
  },
  {
    text: '0 DOM reads',
    font: metricFont,
    lineHeight: (s, m) => Math.round((m ? 36 : 52) * s * 1.1),
    align: 'center',
    cssClass: 'portal-char--metric',
    marginTop: (s, m) => Math.round((m ? 40 : 50) * s),
  },
  {
    text: '500x faster',
    font: metricFont,
    lineHeight: (s, m) => Math.round((m ? 36 : 52) * s * 1.1),
    align: 'center',
    cssClass: 'portal-char--metric',
    marginTop: (s, m) => Math.round((m ? 40 : 50) * s),
  },
  {
    text: 'THAN DOM MEASUREMENT',
    font: metricLabelFont,
    lineHeight: (s) => Math.round(12 * s * 1.6),
    align: 'center',
    cssClass: 'portal-char--metric-label',
    marginTop: (s) => Math.round(8 * s),
  },
  // Section: Explore
  {
    text: 'Explore',
    font: h2Font,
    lineHeight: (s, m) => Math.round((m ? 24 : 36) * s * 1.15),
    align: 'center',
    cssClass: 'portal-char--heading',
    marginTop: (s, m) => Math.round((m ? 100 : 160) * s),
  },
  {
    text: 'Twenty-five interactive demos across five tracks. Each one built on the same quiet insight: text layout is arithmetic, and arithmetic is free.',
    font: (s) => bodyFont(s),
    lineHeight: (s) => Math.round(16 * s * 1.65),
    align: 'center',
    cssClass: 'portal-char--body',
    marginTop: (s) => Math.round(24 * s),
  },
]

const TRACK_DESCRIPTIONS: Record<string, string> = {
  'Foundations': 'Understand why pretext exists and how to start using it',
  'Core Patterns': 'Accordions, chat bubbles, masonry grids, and balanced text',
  'Advanced': 'Editorial layouts, virtualized lists, canvas rendering, i18n',
  'Creative': 'Kinetic type, ASCII art, text physics, and interactive experiments',
  'Reference': 'API docs, performance guide, recipes, and accessibility',
}

// --- Types ---

interface CharEl {
  el: HTMLSpanElement
  tx: number
  ty: number
  x: number
  y: number
  vx: number
  vy: number
  isHero: boolean
}

// --- State ---

let portalEl: HTMLElement
let charLayer: HTMLElement
let chars: CharEl[] = []
let containerWidth = 0
let mouseX = -1
let mouseY = -1
let prevMouseX = -1
let prevMouseY = -1
let cursorSpeed = 0
let mode: InteractionMode = 'scared'
let textScale = 1
let inverted = false
let running = false

// --- Build character spans ---

function buildCharSpans() {
  const isMobile = containerWidth < 640
  const padding = isMobile ? 20 : 48
  const maxWidth = Math.min(containerWidth - padding * 2, 640)
  const centerX = (containerWidth - maxWidth) / 2

  const measureCtx = document.createElement('canvas').getContext('2d')!
  const oldChars = chars
  const newChars: CharEl[] = []
  let spanIndex = 0
  let y = 0

  function getSpan(): HTMLSpanElement {
    if (spanIndex < oldChars.length) {
      return oldChars[spanIndex++]!.el
    }
    const span = document.createElement('span')
    span.className = 'portal-char'
    charLayer.appendChild(span)
    spanIndex++
    return span
  }

  for (const block of BLOCKS) {
    const font = block.font(textScale, isMobile)
    const lh = block.lineHeight(textScale, isMobile)
    y += block.marginTop(textScale, isMobile)

    const prepared = prepareWithSegments(block.text, font)
    const layout = layoutWithLines(prepared, maxWidth, lh)

    measureCtx.font = font
    for (const line of layout.lines) {
      const lineWidth = measureCtx.measureText(line.text).width
      let x = block.align === 'center'
        ? centerX + (maxWidth - lineWidth) / 2
        : centerX

      for (const char of line.text) {
        const cw = measureCtx.measureText(char).width
        const span = getSpan()
        span.textContent = char === ' ' ? '\u00A0' : char
        span.style.font = font
        span.className = `portal-char ${block.cssClass}`

        const tx = x
        const ty = y
        const old = newChars.length < oldChars.length ? oldChars[newChars.length] : null
        const isHero = block.cssClass === 'portal-char--hero'

        newChars.push({
          el: span, tx, ty,
          x: old ? old.x : tx,
          y: old ? old.y : ty,
          vx: 0, vy: 0, isHero,
        })
        x += cw
      }
      y += lh
    }
  }

  // Remove excess
  for (let i = spanIndex; i < oldChars.length; i++) {
    oldChars[i]!.el.remove()
  }

  portalEl.style.minHeight = `${y + 100}px`
  chars = newChars
}

// --- Physics ---

function update() {
  if (prevMouseX >= 0 && mouseX >= 0) {
    const dx = mouseX - prevMouseX
    const dy = mouseY - prevMouseY
    cursorSpeed = cursorSpeed * 0.7 + Math.sqrt(dx * dx + dy * dy) * 0.3
  } else {
    cursorSpeed *= 0.9
  }
  prevMouseX = mouseX
  prevMouseY = mouseY

  const spring = 0.07
  const damping = 0.78

  for (const c of chars) {
    if (mouseX >= 0) {
      const dx = c.x - mouseX
      const dy = c.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (mode === 'scared') {
        const radius = 150
        if (dist < radius && dist > 0) {
          const proximity = 1 - dist / radius
          const speedFactor = Math.min(cursorSpeed / 12, 1)
          const nx = dx / dist
          const ny = dy / dist
          if (speedFactor > 0.2) {
            c.vx += nx * proximity * (3 + speedFactor * 20) * 0.5
            c.vy += ny * proximity * (3 + speedFactor * 20) * 0.5
          } else {
            c.vx += (Math.random() - 0.5) * proximity * 1.2
            c.vy += (Math.random() - 0.5) * proximity * 1.2
          }
        }
      } else if (mode === 'magnify') {
        const radius = 130
        if (dist < radius && dist > 0) {
          const proximity = 1 - dist / radius
          const nx = dx / dist
          const ny = dy / dist
          c.vx += nx * proximity * 2.5 * 0.15
          c.vy += ny * proximity * 2.5 * 0.15
        }
      } else {
        const radius = 80
        if (dist < radius && dist > 0) {
          const proximity = 1 - dist / radius
          const nx = dx / dist
          const ny = dy / dist
          c.vx += nx * proximity * proximity * 2.5 * 0.2
          c.vy += ny * proximity * proximity * 2.5 * 0.2
        }
      }
    }

    c.vx += (c.tx - c.x) * spring
    c.vy += (c.ty - c.y) * spring
    c.vx *= damping
    c.vy *= damping
    c.x += c.vx
    c.y += c.vy

    // Transform
    let scaleY = inverted ? -1 : 1
    let extraScale = 1

    if (mode === 'magnify' && mouseX >= 0) {
      const dx = c.x - mouseX
      const dy = c.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 130) {
        extraScale = 1 + (1 - dist / 130) * 0.7
      }
    }

    c.el.style.transform = `translate(${c.x}px, ${c.y}px) scale(${extraScale}, ${scaleY * extraScale})`
  }
}

function tick() {
  if (!running) return
  update()
  requestAnimationFrame(tick)
}

// --- Track cards (HTML, not char spans) ---

function buildTrackCards(): string {
  return tracks.map((track, i) => {
    const colors = ['var(--track-foundations)', 'var(--track-core)', 'var(--track-advanced)', 'var(--track-creative)', 'var(--track-reference)']
    const linkPage = track.title === 'Foundations'
      ? (track.pages[1] ?? track.pages[0]!)
      : track.pages[0]!
    return `
      <a href="${linkPage.href}" class="track-card" style="--track-accent: ${colors[i]}">
        <div class="track-card__title">${track.title}</div>
        <div class="track-card__desc">${TRACK_DESCRIPTIONS[track.title] ?? ''}</div>
      </a>
    `
  }).join('')
}

// --- Init ---

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  const mainContent = document.querySelector('.content') as HTMLElement
  if (mainContent) mainContent.classList.add('content--newspaper')

  const ctrlState = getControlState()
  mode = ctrlState.mode
  textScale = ctrlState.textScale
  inverted = ctrlState.inverted

  content.innerHTML = `
    <div class="museum-portal" id="museum-portal">
      <div class="portal-chars" id="portal-chars"></div>
    </div>
    <div class="portal-tracks">
      <div class="track-grid">${buildTrackCards()}</div>
    </div>
  `

  portalEl = document.getElementById('museum-portal')!
  charLayer = document.getElementById('portal-chars')!
  containerWidth = portalEl.offsetWidth

  buildCharSpans()

  // Mouse tracking relative to the char layer
  const trackMouse = (e: MouseEvent) => {
    const r = charLayer.getBoundingClientRect()
    mouseX = e.clientX - r.left
    mouseY = e.clientY - r.top
  }

  window.addEventListener('mousemove', trackMouse)
  window.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1 })

  document.addEventListener('touchmove', (e) => {
    const r = charLayer.getBoundingClientRect()
    const touch = e.touches[0]!
    mouseX = touch.clientX - r.left
    mouseY = touch.clientY - r.top
  }, { passive: true })

  document.addEventListener('touchend', () => { mouseX = -1; mouseY = -1 })

  // Resize
  new ResizeObserver(() => {
    containerWidth = portalEl.offsetWidth
    buildCharSpans()
  }).observe(portalEl)

  // Control changes
  onControlChange((s) => {
    mode = s.mode
    inverted = s.inverted
    if (s.textScale !== textScale) {
      textScale = s.textScale
      buildCharSpans()
    }
  })

  running = true
  requestAnimationFrame(tick)
}

init()
