import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createSlider } from '../components/slider'
import { createPerfMeter } from '../components/performance-meter'

const SAMPLE_TEXT = `Canvas rendering with pretext gives you full control over how text is painted. Unlike DOM text, canvas text can be transformed, composited, and animated with arbitrary shaders and effects. The challenge has always been line breaking — the canvas API only provides single-line fillText with no wrapping.

Pretext solves this by computing line breaks offline. You call layoutWithLines() to get an array of LayoutLine objects, each containing the text content and its pixel width. Then you simply iterate and call ctx.fillText() for each line at the correct Y position.

This combination enables rich text rendering on canvas: multi-column layouts, text along paths, text with per-character effects, and more. Because pretext's layout is pure arithmetic, you can recompute line breaks every frame — essential for interactive canvas applications where the text area might change due to zoom, pan, or window resize.`

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Canvas Rendering</h1>
      <p class="content__subtitle">Render multiline text on <code>&lt;canvas&gt;</code> with <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutWithLines()</span>.</p>
    </div>

    <div class="content__section">
      <h2>Demo</h2>
      <p>Pan with mouse drag, zoom with scroll wheel. Text re-wraps at the effective width on every zoom change.</p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-4);margin:var(--space-4) 0">
        <div id="zoom-slider" style="min-width:200px;flex:1"></div>
      </div>
      <div id="canvas-perf" style="margin-bottom:var(--space-4)"></div>
      <div class="demo-area demo-area--full" style="position:relative;height:500px;overflow:hidden;cursor:grab;" id="canvas-wrapper">
        <canvas id="text-canvas" style="width:100%;height:100%;display:block;"></canvas>
        <div id="canvas-info" style="position:absolute;bottom:var(--space-2);right:var(--space-2);font-size:var(--text-xs);font-family:var(--font-code);color:var(--color-text-tertiary);background:var(--color-bg);padding:var(--space-1) var(--space-2);border-radius:var(--radius-sm);pointer-events:none;"></div>
      </div>
      <div id="canvas-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const wrapper = document.getElementById('canvas-wrapper')!
  const canvas = document.getElementById('text-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const infoEl = document.getElementById('canvas-info')!
  const perfMeter = createPerfMeter(document.getElementById('canvas-perf')!)

  const prepared = prepareWithSegments(SAMPLE_TEXT, FONT)

  let panX = 20
  let panY = 20
  let zoom = 1
  let isPanning = false
  let lastMouseX = 0
  let lastMouseY = 0

  const TEXT_MAX_WIDTH = 600

  function getCanvasSize() {
    const rect = wrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width: rect.width, height: rect.height }
  }

  function render() {
    const { width, height } = getCanvasSize()

    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    // Compute effective max width at current zoom
    const effectiveMaxWidth = TEXT_MAX_WIDTH

    // Layout text
    const { result: linesResult, elapsed } = timeExecution(() =>
      layoutWithLines(prepared, effectiveMaxWidth, LINE_HEIGHT)
    )

    // Draw text background
    ctx.fillStyle = '#1a1a1a'
    const textBlockHeight = linesResult.height + 32
    ctx.fillRect(-12, -12, effectiveMaxWidth + 24, textBlockHeight + 24)
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1 / zoom
    ctx.strokeRect(-12, -12, effectiveMaxWidth + 24, textBlockHeight + 24)

    // Draw width indicator
    ctx.strokeStyle = '#6e9eff44'
    ctx.lineWidth = 1 / zoom
    ctx.setLineDash([4 / zoom, 4 / zoom])
    ctx.beginPath()
    ctx.moveTo(effectiveMaxWidth, -12)
    ctx.lineTo(effectiveMaxWidth, textBlockHeight + 12)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw lines
    ctx.font = FONT
    ctx.fillStyle = '#e8e8e8'
    ctx.textBaseline = 'top'

    linesResult.lines.forEach((line, i) => {
      const y = i * LINE_HEIGHT + (LINE_HEIGHT - 16) / 2

      // Subtle line number
      ctx.fillStyle = '#333'
      ctx.fillText(`${i + 1}`, -40, y)

      // Line text
      ctx.fillStyle = '#e8e8e8'
      ctx.fillText(line.text, 0, y)

      // Width indicator dot
      ctx.fillStyle = '#6e9eff'
      ctx.beginPath()
      ctx.arc(line.width + 4, y + 8, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()

    // Info overlay
    infoEl.textContent = `zoom: ${zoom.toFixed(2)}x | pan: (${Math.round(panX)}, ${Math.round(panY)}) | lines: ${linesResult.lineCount} | width: ${effectiveMaxWidth}px`

    perfMeter.update([
      { label: 'layoutWithLines()', value: elapsed },
      { label: `${linesResult.lineCount} lines`, value: linesResult.height },
    ])
  }

  // Zoom slider
  createSlider(document.getElementById('zoom-slider')!, {
    label: 'Zoom',
    min: 25,
    max: 300,
    value: 100,
    step: 5,
    formatValue: v => `${v}%`,
    onChange: v => {
      zoom = v / 100
      render()
    },
  })

  // Pan handling
  function onMouseDown(e: MouseEvent) {
    isPanning = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
    wrapper.style.cursor = 'grabbing'
  }

  function onMouseMove(e: MouseEvent) {
    if (!isPanning) return
    const dx = e.clientX - lastMouseX
    const dy = e.clientY - lastMouseY
    panX += dx
    panY += dy
    lastMouseX = e.clientX
    lastMouseY = e.clientY
    render()
  }

  function onMouseUp() {
    isPanning = false
    wrapper.style.cursor = 'grab'
  }

  canvas.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  // Touch pan
  let lastTouchX = 0
  let lastTouchY = 0

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      lastTouchX = e.touches[0]!.clientX
      lastTouchY = e.touches[0]!.clientY
    }
  }, { passive: true })

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const dx = e.touches[0]!.clientX - lastTouchX
      const dy = e.touches[0]!.clientY - lastTouchY
      panX += dx
      panY += dy
      lastTouchX = e.touches[0]!.clientX
      lastTouchY = e.touches[0]!.clientY
      render()
    }
  }, { passive: true })

  // Zoom with wheel
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const prevZoom = zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    zoom = Math.max(0.25, Math.min(3, zoom * delta))

    // Zoom toward cursor
    panX = mx - (mx - panX) * (zoom / prevZoom)
    panY = my - (my - panY) * (zoom / prevZoom)

    render()
  }, { passive: false })

  render()

  const resizeObserver = new ResizeObserver(() => render())
  resizeObserver.observe(wrapper)

  const sourceCode = `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '16px Inter')

function render() {
  const { lines, lineCount, height } = layoutWithLines(
    prepared, maxWidth, 24
  )

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  ctx.font = '16px Inter'
  ctx.fillStyle = '#e8e8e8'
  ctx.textBaseline = 'top'

  lines.forEach((line, i) => {
    ctx.fillText(line.text, 0, i * 24)
    // line.width gives exact pixel width for alignment
  })

  ctx.restore()
}

// On wheel zoom: just re-render — layoutWithLines costs ~0.05ms
canvas.addEventListener('wheel', (e) => {
  zoom *= e.deltaY > 0 ? 0.9 : 1.1
  render() // instant re-layout + paint
})`

  await createSourceViewer(document.getElementById('canvas-source')!, {
    code: sourceCode,
    title: 'Canvas Rendering with Pretext',
  })
}

init()
