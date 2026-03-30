import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createPerfMeter } from '../components/performance-meter'

const EDITORIAL_TEXT = `Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing, as well as adjusting the space between pairs of letters. The term typography is also applied to the style, arrangement, and appearance of the letters, numbers, and symbols created by the process. Type design is a closely related craft, sometimes considered part of typography; most typographers do not design typefaces, and some type designers do not consider themselves typographers. Typography also may be used as an ornamental and decorative device, unrelated to the communication of information.

Typography is the work of typesetters, compositors, typographers, graphic designers, art directors, manga artists, comic book artists, and, now, anyone who arranges words, letters, numbers, and symbols for publication, display, or distribution, from clerical workers and newsletter writers to anyone self-publishing materials. Until the Digital Age, typography was a specialized occupation. Digitization opened up typography to new generations of previously unrelated designers and lay users. As the capability to create typography has become ubiquitous, the application of principles and best practices developed over generations of skilled workers and professionals has diminished.`

interface Obstacle {
  x: number
  y: number
  radius: number
  color: string
  dragging: boolean
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Editorial Layout</h1>
      <p class="content__subtitle">Text flows around draggable obstacles using <span class="api-tag">layoutNextLine()</span> with per-line variable widths.</p>
    </div>

    <div class="content__section">
      <h2>Demo</h2>
      <p>Drag the colored circles to see text reflow in real time. Each line's max width is reduced where the obstacle overlaps.</p>
      <div id="editorial-perf" style="margin-bottom:var(--space-4)"></div>
      <div class="demo-area demo-area--full" style="position:relative;height:600px;overflow:hidden;cursor:default;" id="editorial-container">
        <canvas id="editorial-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div id="editorial-source" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <div class="explanation">
        <h3>How It Works</h3>
        <p><span class="api-tag">layoutNextLine()</span> takes a starting cursor and a <code>maxWidth</code>. By computing a different <code>maxWidth</code> for each line based on obstacle overlap, we create text that flows around arbitrary shapes.</p>
        <p>For each line at vertical position <code>y</code>, we check which obstacles overlap that row and subtract their horizontal extent from the available width. If an obstacle is on the left, we indent the line start. If on the right, we reduce the line width.</p>
        <div class="key-insight">This runs at 60fps because layoutNextLine() costs ~0.005ms per line. A full page reflow of 30+ lines takes well under 1ms — leaving 15ms of headroom per frame.</div>
      </div>
    </div>
  `

  const container = document.getElementById('editorial-container')!
  const canvas = document.getElementById('editorial-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const perfMeter = createPerfMeter(document.getElementById('editorial-perf')!)

  const obstacles: Obstacle[] = [
    { x: 200, y: 150, radius: 70, color: '#6e9eff', dragging: false },
    { x: 500, y: 300, radius: 55, color: '#fbbf24', dragging: false },
  ]

  const prepared = prepareWithSegments(EDITORIAL_TEXT, FONT)

  const PADDING = 24
  const COL_GAP = 40
  let activeObstacle: Obstacle | null = null

  function getCanvasSize() {
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width: rect.width, height: rect.height }
  }

  function getLineWidthAndOffset(y: number, colLeft: number, colWidth: number): { offset: number; width: number } {
    let leftIndent = 0
    let rightIndent = 0

    for (const obs of obstacles) {
      const dy = y + LINE_HEIGHT / 2 - obs.y
      if (Math.abs(dy) < obs.radius) {
        const halfChord = Math.sqrt(obs.radius * obs.radius - dy * dy)
        const obsLeft = obs.x - halfChord
        const obsRight = obs.x + halfChord

        // Check if obstacle overlaps this column
        if (obsRight > colLeft && obsLeft < colLeft + colWidth) {
          const relLeft = obsLeft - colLeft
          const relRight = obsRight - colLeft

          if (relLeft <= 0) {
            // Obstacle covers the left side
            leftIndent = Math.max(leftIndent, relRight + 8)
          } else if (relRight >= colWidth) {
            // Obstacle covers the right side
            rightIndent = Math.max(rightIndent, colWidth - relLeft + 8)
          } else {
            // Obstacle is in the middle — shrink from the closer side
            if (relLeft < colWidth - relRight) {
              leftIndent = Math.max(leftIndent, relRight + 8)
            } else {
              rightIndent = Math.max(rightIndent, colWidth - relLeft + 8)
            }
          }
        }
      }
    }

    return {
      offset: leftIndent,
      width: Math.max(colWidth - leftIndent - rightIndent, 50),
    }
  }

  function render() {
    const { width, height } = getCanvasSize()

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-raised').trim() || '#141414'
    ctx.fillRect(0, 0, width, height)

    // Two-column layout
    const totalTextWidth = width - PADDING * 2 - COL_GAP
    const colWidth = totalTextWidth / 2
    const columns = [
      { left: PADDING, width: colWidth },
      { left: PADDING + colWidth + COL_GAP, width: colWidth },
    ]

    const start = performance.now()

    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let colIndex = 0
    let y = PADDING

    ctx.font = FONT
    ctx.fillStyle = '#e8e8e8'
    ctx.textBaseline = 'top'

    while (colIndex < columns.length) {
      const col = columns[colIndex]!

      if (y + LINE_HEIGHT > height - PADDING) {
        colIndex++
        y = PADDING
        continue
      }

      const { offset, width: lineWidth } = getLineWidthAndOffset(y, col.left, col.width)
      const line = layoutNextLine(prepared, cursor, lineWidth)

      if (!line) break

      ctx.fillStyle = '#e8e8e8'
      ctx.fillText(line.text, col.left + offset, y + (LINE_HEIGHT - 16) / 2)

      cursor = line.end
      y += LINE_HEIGHT
    }

    const elapsed = performance.now() - start

    // Draw obstacles
    for (const obs of obstacles) {
      ctx.beginPath()
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2)
      ctx.fillStyle = obs.color + '30'
      ctx.fill()
      ctx.strokeStyle = obs.color
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw drag handle
      ctx.beginPath()
      ctx.arc(obs.x, obs.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = obs.color
      ctx.fill()
    }

    // Draw column divider
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    const dividerX = PADDING + colWidth + COL_GAP / 2
    ctx.beginPath()
    ctx.moveTo(dividerX, PADDING)
    ctx.lineTo(dividerX, height - PADDING)
    ctx.stroke()
    ctx.setLineDash([])

    perfMeter.update([
      { label: 'Full reflow', value: elapsed },
    ])
  }

  // Drag handling
  function getEventPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]!
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
  }

  function onPointerDown(e: MouseEvent | TouchEvent) {
    const pos = getEventPos(e)
    for (const obs of obstacles) {
      const dx = pos.x - obs.x
      const dy = pos.y - obs.y
      if (dx * dx + dy * dy < obs.radius * obs.radius) {
        activeObstacle = obs
        obs.dragging = true
        e.preventDefault()
        break
      }
    }
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (!activeObstacle) return
    e.preventDefault()
    const pos = getEventPos(e)
    activeObstacle.x = pos.x
    activeObstacle.y = pos.y
    requestAnimationFrame(render)
  }

  function onPointerUp() {
    if (activeObstacle) {
      activeObstacle.dragging = false
      activeObstacle = null
    }
  }

  canvas.addEventListener('mousedown', onPointerDown)
  canvas.addEventListener('mousemove', onPointerMove)
  canvas.addEventListener('mouseup', onPointerUp)
  canvas.addEventListener('mouseleave', onPointerUp)
  canvas.addEventListener('touchstart', onPointerDown, { passive: false })
  canvas.addEventListener('touchmove', onPointerMove, { passive: false })
  canvas.addEventListener('touchend', onPointerUp)

  render()

  // Re-render on resize
  const resizeObserver = new ResizeObserver(() => render())
  resizeObserver.observe(container)

  const sourceCode = `import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '16px Inter')

function getLineWidth(y: number, obstacles: Obstacle[], colWidth: number) {
  let leftIndent = 0, rightIndent = 0

  for (const obs of obstacles) {
    const dy = y + lineHeight / 2 - obs.y
    if (Math.abs(dy) < obs.radius) {
      const halfChord = Math.sqrt(obs.radius ** 2 - dy ** 2)
      // ... compute indent based on obstacle position
    }
  }

  return { offset: leftIndent, width: colWidth - leftIndent - rightIndent }
}

// Lay out text line by line with variable widths
let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
let y = 0

while (y < containerHeight) {
  const { offset, width } = getLineWidth(y, obstacles, colWidth)
  const line = layoutNextLine(prepared, cursor, width)
  if (!line) break

  ctx.fillText(line.text, colLeft + offset, y)
  cursor = line.end
  y += lineHeight
}

// On drag: reflow every frame (~0.15ms for 30 lines)`

  await createSourceViewer(document.getElementById('editorial-source')!, {
    code: sourceCode,
    title: 'Editorial Layout with Obstacles',
  })
}

init()
