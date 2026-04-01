import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import type { LayoutCursor } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT } from '../shared/pretext-helpers'
import { tracks } from '../shared/nav-data'
import { NEWSPAPER_TITLE, NEWSPAPER_TEXT } from '../shared/newspaper-text'
import { TRAY_IMAGES } from '../shared/newspaper-images'
import type { TrayImageDef } from '../shared/newspaper-images'

// --- Types ---

interface PlacedImage {
  def: TrayImageDef
  x: number
  y: number
  width: number
  height: number
}

interface RectObstacle {
  x: number
  y: number
  width: number
  height: number
  padding: number
}

type DragPhase = 'idle' | 'floating-from-tray' | 'dragging-placed'

interface DragState {
  phase: DragPhase
  sourceDef: TrayImageDef | null
  sourceIndex: number
  placedIndex: number
  currentX: number
  currentY: number
  offsetX: number
  offsetY: number
  width: number
  height: number
  growProgress: number // 0-1 for grow-in animation
}

// --- Constants ---

const PADDING = 28
const COL_GAP = 32
const MASTHEAD_HEIGHT = 100
const TRAY_HEIGHT = 100
const TRAY_THUMB_W = 60
const TRAY_THUMB_H = 44
const TRAY_GAP = 20
const IMAGE_PADDING = 10
const CAPTION_HEIGHT = 16
const TEXT_COLOR = '#d8d8dc'
const MASTHEAD_COLOR = '#ededf0'
const RULE_COLOR = 'rgba(255,255,255,0.08)'
const MIN_LINE_WIDTH = 40
const GROW_DURATION = 180 // ms for image grow-in

// --- State ---

let canvasEl: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let containerEl: HTMLElement
let prepared: ReturnType<typeof prepareWithSegments>
let placedImages: PlacedImage[] = []
let trayAvailable: boolean[] = []
let dragState: DragState = {
  phase: 'idle', sourceDef: null, sourceIndex: -1, placedIndex: -1,
  currentX: 0, currentY: 0, offsetX: 0, offsetY: 0,
  width: 0, height: 0, growProgress: 1,
}
let lastReflowMs = 0
let lastLineCount = 0
let canvasWidth = 0
let canvasHeight = 0

// Entrance animation
let revealProgress = 0
let revealStartTime = 0
let isRevealing = false

// Grow-in animation
let growStartTime = 0
let isGrowing = false

// Track whether the cursor has entered the canvas yet (for auto-grab)
let hasAutoGrabbed = false

// Mobile: drifting image state
let isMobile = false
let isDrifting = false
let driftImage: PlacedImage | null = null
let driftAngle = Math.PI * 0.3 // direction of drift
let driftSpeed = 0.4 // px per frame
let driftStartTime = 0

function getResponsiveConfig(w: number) {
  if (w >= 900) return { columns: 3, imageScale: 1.0 }
  if (w >= 580) return { columns: 2, imageScale: 0.8 }
  return { columns: 1, imageScale: 0.65 }
}

// --- Canvas sizing ---

function sizeCanvas(): { width: number; height: number } {
  const rect = containerEl.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  // Full height of content area minus the below-fold section
  const h = rect.height

  canvasEl.width = rect.width * dpr
  canvasEl.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  canvasWidth = rect.width
  canvasHeight = h
  return { width: rect.width, height: h }
}

// --- Obstacle avoidance (rectangles) ---

function getLineWidthAndOffset(
  lineY: number,
  colLeft: number,
  colWidth: number,
  obstacles: RectObstacle[],
): { offset: number; width: number } {
  let leftIndent = 0
  let rightIndent = 0

  for (const obs of obstacles) {
    const obsTop = obs.y - obs.padding
    const obsBottom = obs.y + obs.height + obs.padding
    const obsLeft = obs.x - obs.padding
    const obsRight = obs.x + obs.width + obs.padding

    if (lineY + LINE_HEIGHT <= obsTop || lineY >= obsBottom) continue
    if (obsRight <= colLeft || obsLeft >= colLeft + colWidth) continue

    const relLeft = obsLeft - colLeft
    const relRight = obsRight - colLeft

    if (relLeft <= 0) {
      leftIndent = Math.max(leftIndent, relRight)
    } else if (relRight >= colWidth) {
      rightIndent = Math.max(rightIndent, colWidth - relLeft)
    } else {
      if (relLeft > colWidth - relRight) {
        rightIndent = Math.max(rightIndent, colWidth - relLeft)
      } else {
        leftIndent = Math.max(leftIndent, relRight)
      }
    }
  }

  return {
    offset: leftIndent,
    width: Math.max(colWidth - leftIndent - rightIndent, MIN_LINE_WIDTH),
  }
}

// --- Drawing functions ---

function drawMasthead(width: number) {
  const centerX = width / 2
  const topY = PADDING

  // Top rule — thick
  ctx.strokeStyle = RULE_COLOR
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PADDING, topY)
  ctx.lineTo(width - PADDING, topY)
  ctx.stroke()

  // Thin rule below
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(PADDING, topY + 5)
  ctx.lineTo(width - PADDING, topY + 5)
  ctx.stroke()

  // Title — Playfair Display
  const titleFontSize = width < 500 ? Math.max(28, width * 0.08) : Math.min(44, width * 0.05)
  ctx.font = `900 ${titleFontSize}px "Playfair Display", Georgia, serif`
  ctx.fillStyle = MASTHEAD_COLOR
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(NEWSPAPER_TITLE, centerX, topY + 14)

  // Dateline
  const dateFont = width < 500 ? Math.max(10, width * 0.028) : Math.min(11, width * 0.014)
  ctx.font = `500 ${dateFont}px Inter, sans-serif`
  ctx.fillStyle = 'rgba(200,200,215,0.7)'
  const reflowStr = lastReflowMs < 0.01 ? '<0.01' : lastReflowMs.toFixed(2)
  const dateline = width < 400
    ? `${reflowStr}ms reflow  \u2022  ${lastLineCount} lines  \u2022  0 DOM reads`
    : `WEDNESDAY, APRIL 1, 2026  \u2022  REFLOW: ${reflowStr}ms  \u2022  ${lastLineCount} LINES  \u2022  0 DOM READS`
  ctx.fillText(dateline, centerX, topY + 20 + titleFontSize + 2)

  // Bottom rules
  const ruleY = topY + MASTHEAD_HEIGHT - 10
  ctx.strokeStyle = RULE_COLOR
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(PADDING, ruleY)
  ctx.lineTo(width - PADDING, ruleY)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PADDING, ruleY + 4)
  ctx.lineTo(width - PADDING, ruleY + 4)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
}

function drawColumnRules(columns: { left: number; width: number }[], contentTop: number, contentBottom: number) {
  ctx.strokeStyle = RULE_COLOR
  ctx.lineWidth = 0.5
  for (let i = 1; i < columns.length; i++) {
    const x = columns[i]!.left - COL_GAP / 2
    ctx.beginPath()
    ctx.moveTo(x, contentTop)
    ctx.lineTo(x, contentBottom)
    ctx.stroke()
  }
}

function drawColumnarText(
  columns: { left: number; width: number }[],
  obstacles: RectObstacle[],
  contentTop: number,
  contentBottom: number,
  maxLines?: number,
): number {
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let colIndex = 0
  let y = contentTop
  let totalLines = 0

  ctx.font = FONT
  ctx.fillStyle = TEXT_COLOR
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  while (colIndex < columns.length) {
    const col = columns[colIndex]!

    if (y + LINE_HEIGHT > contentBottom) {
      colIndex++
      y = contentTop
      continue
    }

    if (maxLines !== undefined && totalLines >= maxLines) break

    const { offset, width: lineWidth } = getLineWidthAndOffset(y, col.left, col.width, obstacles)

    if (lineWidth < MIN_LINE_WIDTH) {
      y += LINE_HEIGHT
      continue
    }

    const line = layoutNextLine(prepared, cursor, lineWidth)
    if (!line) break

    if (isRevealing && totalLines > revealProgress) break

    ctx.fillStyle = TEXT_COLOR
    ctx.fillText(line.text, col.left + offset, y + (LINE_HEIGHT - 16) / 2)

    cursor = line.end
    y += LINE_HEIGHT
    totalLines++
  }

  return totalLines
}

function drawPlacedImage(img: PlacedImage, isDragging: boolean) {
  if (isDragging) {
    ctx.save()
    ctx.shadowColor = 'rgba(129,140,248,0.4)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 4
  }

  ctx.strokeStyle = isDragging ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.08)'
  ctx.lineWidth = isDragging ? 1.5 : 1
  ctx.strokeRect(img.x, img.y, img.width, img.height)

  img.def.draw(ctx, img.x, img.y, img.width, img.height)

  if (isDragging) ctx.restore()

  // Caption
  ctx.font = `400 ${Math.max(9, img.width * 0.06)}px Inter, sans-serif`
  ctx.fillStyle = 'rgba(160,160,176,0.5)'
  ctx.textAlign = 'center'
  ctx.fillText(img.def.label, img.x + img.width / 2, img.y + img.height + 3)
  ctx.textAlign = 'left'
}

function drawFloatingImage() {
  if (dragState.phase !== 'floating-from-tray' || !dragState.sourceDef) return

  const scale = dragState.growProgress
  const fullW = dragState.width
  const fullH = dragState.height
  const w = fullW * scale
  const h = fullH * scale
  const x = dragState.currentX - w / 2
  const y = dragState.currentY - h / 2

  ctx.save()
  ctx.globalAlpha = 0.4 + scale * 0.6
  ctx.shadowColor = 'rgba(129,140,248,0.45)'
  ctx.shadowBlur = 28 * scale
  ctx.shadowOffsetY = 6 * scale

  ctx.strokeStyle = 'rgba(129,140,248,0.5)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, w, h)
  dragState.sourceDef.draw(ctx, x, y, w, h)

  ctx.restore()

  // Caption
  if (scale > 0.5) {
    ctx.globalAlpha = (scale - 0.5) * 2
    ctx.font = `400 ${Math.max(9, w * 0.06)}px Inter, sans-serif`
    ctx.fillStyle = 'rgba(160,160,176,0.5)'
    ctx.textAlign = 'center'
    ctx.fillText(dragState.sourceDef.label, x + w / 2, y + h + 3)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
  }
}

function drawTray(width: number, height: number) {
  const trayTop = height - TRAY_HEIGHT

  // Gradient fade
  const fadeGrad = ctx.createLinearGradient(0, trayTop - 16, 0, trayTop + 8)
  fadeGrad.addColorStop(0, 'rgba(17,17,22,0)')
  fadeGrad.addColorStop(1, 'rgba(17,17,22,0.95)')
  ctx.fillStyle = fadeGrad
  ctx.fillRect(0, trayTop - 16, width, 24)

  ctx.fillStyle = 'rgba(17,17,22,0.95)'
  ctx.fillRect(0, trayTop + 8, width, TRAY_HEIGHT - 8)

  // Top border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, trayTop + 8)
  ctx.lineTo(width, trayTop + 8)
  ctx.stroke()

  const availableCount = trayAvailable.filter(Boolean).length
  if (availableCount === 0) {
    ctx.font = '400 12px Inter, sans-serif'
    ctx.fillStyle = 'rgba(160,160,176,0.35)'
    ctx.textAlign = 'center'
    const removeHint = isMobile ? 'double-tap' : 'double-click'
    ctx.fillText(`All images placed \u2014 ${removeHint} any to remove`, width / 2, trayTop + TRAY_HEIGHT / 2 + 2)
    ctx.textAlign = 'left'
    return
  }

  // Draw thumbnails
  const totalW = availableCount * TRAY_THUMB_W + (availableCount - 1) * TRAY_GAP
  let startX = (width - totalW) / 2
  const thumbY = trayTop + (TRAY_HEIGHT - TRAY_THUMB_H - CAPTION_HEIGHT) / 2 - 4

  for (let i = 0; i < TRAY_IMAGES.length; i++) {
    if (!trayAvailable[i]) continue
    // If this image is currently floating, draw it as ghost
    if (dragState.phase === 'floating-from-tray' && dragState.sourceIndex === i) {
      ctx.globalAlpha = 0.25
    }

    const def = TRAY_IMAGES[i]!
    const tx = startX

    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1

    const r = 4
    ctx.beginPath()
    ctx.roundRect(tx - 1, thumbY - 1, TRAY_THUMB_W + 2, TRAY_THUMB_H + 2, r)
    ctx.stroke()

    def.draw(ctx, tx, thumbY, TRAY_THUMB_W, TRAY_THUMB_H)

    ctx.font = '400 9px Inter, sans-serif'
    ctx.fillStyle = 'rgba(160,160,176,0.45)'
    ctx.textAlign = 'center'
    ctx.fillText(def.label, tx + TRAY_THUMB_W / 2, thumbY + TRAY_THUMB_H + 5)
    ctx.textAlign = 'left'

    ctx.globalAlpha = 1
    startX += TRAY_THUMB_W + TRAY_GAP
  }

  // Hint text
  if (dragState.phase === 'idle' || isDrifting) {
    ctx.font = '400 11px Inter, sans-serif'
    ctx.fillStyle = 'rgba(129,140,248,0.4)'
    ctx.textAlign = 'center'
    const hint = isMobile
      ? 'drag to place \u2022 double-tap to remove'
      : 'hover to pick up \u2022 click to place \u2022 double-click to remove'
    ctx.fillText(hint, width / 2, trayTop + TRAY_HEIGHT - 18)
    ctx.textAlign = 'left'
  }
}

function drawPerfOverlay(width: number, height: number) {
  const boxW = 130
  const boxH = 42
  const boxX = width - PADDING - boxW
  const boxY = height - TRAY_HEIGHT - boxH - 16

  ctx.fillStyle = 'rgba(17,17,22,0.85)'
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 6)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 6)
  ctx.stroke()

  ctx.font = '600 8px Inter, sans-serif'
  ctx.fillStyle = 'rgba(160,160,176,0.45)'
  ctx.textAlign = 'left'
  ctx.fillText('PRESS ROOM', boxX + 10, boxY + 10)

  const reflowStr = lastReflowMs < 0.01 ? '<0.01' : lastReflowMs.toFixed(2)
  ctx.font = '400 10px Inter, sans-serif'
  ctx.fillStyle = '#34d399'
  ctx.fillText(`${reflowStr}ms`, boxX + 10, boxY + 24)

  ctx.fillStyle = 'rgba(160,160,176,0.5)'
  ctx.fillText(`${lastLineCount} lines`, boxX + 70, boxY + 24)
}

// --- Main render ---

function buildObstacles(): RectObstacle[] {
  const obstacles: RectObstacle[] = placedImages.map((img, i) => {
    if (dragState.phase === 'dragging-placed' && dragState.placedIndex === i) {
      return {
        x: dragState.currentX - dragState.offsetX,
        y: dragState.currentY - dragState.offsetY,
        width: dragState.width,
        height: dragState.height + CAPTION_HEIGHT,
        padding: IMAGE_PADDING,
      }
    }
    return {
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height + CAPTION_HEIGHT,
      padding: IMAGE_PADDING,
    }
  })

  if (dragState.phase === 'floating-from-tray' && dragState.sourceDef) {
    const scale = dragState.growProgress
    const w = dragState.width * scale
    const h = dragState.height * scale
    obstacles.push({
      x: dragState.currentX - w / 2,
      y: dragState.currentY - h / 2,
      width: w,
      height: h + CAPTION_HEIGHT * scale,
      padding: IMAGE_PADDING,
    })
  }

  // Drift image (mobile)
  if (isDrifting && driftImage) {
    obstacles.push({
      x: driftImage.x,
      y: driftImage.y,
      width: driftImage.width,
      height: driftImage.height + CAPTION_HEIGHT,
      padding: IMAGE_PADDING,
    })
  }

  return obstacles
}

function render() {
  const { width, height } = sizeCanvas()
  const config = getResponsiveConfig(width)

  // Background
  ctx.fillStyle = '#111116'
  ctx.fillRect(0, 0, width, height)

  drawMasthead(width)

  // Columns
  const contentTop = PADDING + MASTHEAD_HEIGHT
  const contentBottom = height - TRAY_HEIGHT - 16
  const totalTextWidth = width - PADDING * 2 - COL_GAP * (config.columns - 1)
  const colWidth = totalTextWidth / config.columns

  const columns: { left: number; width: number }[] = []
  for (let i = 0; i < config.columns; i++) {
    columns.push({
      left: PADDING + i * (colWidth + COL_GAP),
      width: colWidth,
    })
  }

  drawColumnRules(columns, contentTop, contentBottom)

  const obstacles = buildObstacles()

  // Layout text
  const start = performance.now()
  const maxLines = isRevealing ? Math.ceil(revealProgress) : undefined
  lastLineCount = drawColumnarText(columns, obstacles, contentTop, contentBottom, maxLines)
  lastReflowMs = performance.now() - start

  // Draw placed images
  placedImages.forEach((img, i) => {
    if (dragState.phase === 'dragging-placed' && dragState.placedIndex === i) return
    drawPlacedImage(img, false)
  })

  // Draw dragged placed image
  if (dragState.phase === 'dragging-placed') {
    const img = placedImages[dragState.placedIndex]!
    drawPlacedImage({
      def: img.def,
      x: dragState.currentX - dragState.offsetX,
      y: dragState.currentY - dragState.offsetY,
      width: dragState.width,
      height: dragState.height,
    }, true)
  } else if (dragState.phase === 'floating-from-tray') {
    drawFloatingImage()
  }

  // Draw drift image (mobile)
  if (isDrifting && driftImage) {
    drawPlacedImage(driftImage, false)
  }

  drawTray(width, height)
  drawPerfOverlay(width, height)
}

// --- Entrance animation ---

function animateEntrance(time: number) {
  if (!revealStartTime) revealStartTime = time
  const elapsed = time - revealStartTime
  const duration = 800

  const t = Math.min(elapsed / duration, 1)
  const eased = 1 - Math.pow(1 - t, 3)
  revealProgress = eased * 120

  render()

  if (t < 1) {
    requestAnimationFrame(animateEntrance)
  } else {
    isRevealing = false
    if (isMobile) startDrift()
    render()
  }
}

// --- Grow-in animation ---

function animateGrow(time: number) {
  if (!growStartTime) growStartTime = time
  const elapsed = time - growStartTime

  const t = Math.min(elapsed / GROW_DURATION, 1)
  // Ease out cubic
  dragState.growProgress = 1 - Math.pow(1 - t, 3)

  render()

  if (t < 1) {
    requestAnimationFrame(animateGrow)
  } else {
    isGrowing = false
    dragState.growProgress = 1
    render()
  }
}

// --- Mobile drift animation ---

function startDrift() {
  if (!isMobile) return
  const config = getResponsiveConfig(canvasWidth)
  const contentTop = PADDING + MASTHEAD_HEIGHT
  const trayTop = canvasHeight - TRAY_HEIGHT

  // Pick the first available tray image
  const idx = getNextAvailableTrayIndex()
  if (idx < 0) return

  const def = TRAY_IMAGES[idx]!
  const w = def.placedWidth * config.imageScale
  const h = def.placedHeight * config.imageScale

  // Start from upper-left area of the text
  driftImage = {
    def,
    x: canvasWidth * 0.15,
    y: contentTop + 40,
    width: w,
    height: h,
  }
  trayAvailable[idx] = false
  isDrifting = true
  driftStartTime = 0
  driftAngle = Math.PI * 0.25 + Math.random() * 0.3
  requestAnimationFrame(animateDrift)
}

function animateDrift(time: number) {
  if (!isDrifting || !driftImage) return
  if (!driftStartTime) driftStartTime = time

  const contentTop = PADDING + MASTHEAD_HEIGHT
  const trayTop = canvasHeight - TRAY_HEIGHT - 20

  // Move the image
  driftImage.x += Math.cos(driftAngle) * driftSpeed
  driftImage.y += Math.sin(driftAngle) * driftSpeed

  // Gentle sine wobble on the angle
  const elapsed = time - driftStartTime
  driftAngle += Math.sin(elapsed * 0.0008) * 0.003

  // Bounce off edges
  if (driftImage.x < PADDING) {
    driftImage.x = PADDING
    driftAngle = Math.PI - driftAngle
  }
  if (driftImage.x + driftImage.width > canvasWidth - PADDING) {
    driftImage.x = canvasWidth - PADDING - driftImage.width
    driftAngle = Math.PI - driftAngle
  }
  if (driftImage.y < contentTop) {
    driftImage.y = contentTop
    driftAngle = -driftAngle
  }
  if (driftImage.y + driftImage.height > trayTop) {
    driftImage.y = trayTop - driftImage.height
    driftAngle = -driftAngle
  }

  render()
  if (isDrifting) requestAnimationFrame(animateDrift)
}

// --- Event handling ---

function getEventPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvasEl.getBoundingClientRect()
  if ('touches' in e && e.touches.length > 0) {
    const touch = e.touches[0]!
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    const touch = e.changedTouches[0]!
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }
  return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
}

function getTrayThumbBounds(): { index: number; x: number; y: number; w: number; h: number }[] {
  const trayTop = canvasHeight - TRAY_HEIGHT
  const availableCount = trayAvailable.filter(Boolean).length
  if (availableCount === 0) return []

  const totalW = availableCount * TRAY_THUMB_W + (availableCount - 1) * TRAY_GAP
  let startX = (canvasWidth - totalW) / 2
  const thumbY = trayTop + (TRAY_HEIGHT - TRAY_THUMB_H - CAPTION_HEIGHT) / 2 - 4

  const bounds: { index: number; x: number; y: number; w: number; h: number }[] = []
  for (let i = 0; i < TRAY_IMAGES.length; i++) {
    if (!trayAvailable[i]) continue
    bounds.push({ index: i, x: startX, y: thumbY, w: TRAY_THUMB_W, h: TRAY_THUMB_H })
    startX += TRAY_THUMB_W + TRAY_GAP
  }
  return bounds
}

function hitTestTray(x: number, y: number): number {
  for (const b of getTrayThumbBounds()) {
    if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + CAPTION_HEIGHT + 8) {
      return b.index
    }
  }
  return -1
}

function hitTestPlaced(x: number, y: number): number {
  for (let i = placedImages.length - 1; i >= 0; i--) {
    const img = placedImages[i]!
    if (x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height + CAPTION_HEIGHT) {
      return i
    }
  }
  return -1
}

function hitTestDrift(x: number, y: number): boolean {
  if (!driftImage) return false
  return (
    x >= driftImage.x &&
    x <= driftImage.x + driftImage.width &&
    y >= driftImage.y &&
    y <= driftImage.y + driftImage.height
  )
}

function getNextAvailableTrayIndex(): number {
  for (let i = 0; i < trayAvailable.length; i++) {
    if (trayAvailable[i]) return i
  }
  return -1
}

function startFloatingFromTray(trayIdx: number, x: number, y: number) {
  const def = TRAY_IMAGES[trayIdx]!
  const config = getResponsiveConfig(canvasWidth)
  const w = def.placedWidth * config.imageScale
  const h = def.placedHeight * config.imageScale

  dragState = {
    phase: 'floating-from-tray',
    sourceDef: def,
    sourceIndex: trayIdx,
    placedIndex: -1,
    currentX: x,
    currentY: y,
    offsetX: 0,
    offsetY: 0,
    width: w,
    height: h,
    growProgress: 0,
  }

  // Start grow-in animation
  isGrowing = true
  growStartTime = 0
  requestAnimationFrame(animateGrow)

  containerEl.style.cursor = 'none'
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  const pos = getEventPos(e)
  const isTouch = 'touches' in e

  // If floating an image, click to place it
  if (dragState.phase === 'floating-from-tray' && dragState.sourceDef) {
    const trayTop = canvasHeight - TRAY_HEIGHT
    if (pos.y < trayTop - 10) {
      const scale = dragState.growProgress
      const w = dragState.width * scale
      const h = dragState.height * scale
      placedImages.push({
        def: dragState.sourceDef,
        x: pos.x - w / 2,
        y: pos.y - h / 2,
        width: w,
        height: h,
      })
      trayAvailable[dragState.sourceIndex] = false
    } else {
      // Clicked back on tray — cancel
    }

    // Reset state
    dragState = {
      phase: 'idle', sourceDef: null, sourceIndex: -1, placedIndex: -1,
      currentX: 0, currentY: 0, offsetX: 0, offsetY: 0,
      width: 0, height: 0, growProgress: 1,
    }
    isGrowing = false
    containerEl.style.cursor = 'default'
    e.preventDefault()
    render()
    return
  }

  // Mobile: grab the drifting image
  if (isTouch && isDrifting && driftImage && hitTestDrift(pos.x, pos.y)) {
    // Stop drift — convert to a placed image and start dragging it
    isDrifting = false
    placedImages.push({ ...driftImage })
    const placedIdx = placedImages.length - 1
    dragState = {
      phase: 'dragging-placed',
      sourceDef: driftImage.def,
      sourceIndex: -1,
      placedIndex: placedIdx,
      currentX: pos.x,
      currentY: pos.y,
      offsetX: pos.x - driftImage.x,
      offsetY: pos.y - driftImage.y,
      width: driftImage.width,
      height: driftImage.height,
      growProgress: 1,
    }
    driftImage = null
    e.preventDefault()
    render()
    return
  }

  // Mobile: tap tray to place an image in the newspaper
  if (isTouch) {
    const trayIdx = hitTestTray(pos.x, pos.y)
    if (trayIdx >= 0 && trayAvailable[trayIdx]) {
      const def = TRAY_IMAGES[trayIdx]!
      const config = getResponsiveConfig(canvasWidth)
      const w = def.placedWidth * config.imageScale
      const h = def.placedHeight * config.imageScale
      const contentTop = PADDING + MASTHEAD_HEIGHT
      // Place in the center of the text area
      placedImages.push({
        def,
        x: (canvasWidth - w) / 2,
        y: contentTop + 40 + placedImages.length * 60,
        width: w,
        height: h,
      })
      trayAvailable[trayIdx] = false
      e.preventDefault()
      render()
      return
    }
  }

  // Check placed image hit — start drag
  const placedIdx = hitTestPlaced(pos.x, pos.y)
  if (placedIdx >= 0) {
    const img = placedImages[placedIdx]!
    dragState = {
      phase: 'dragging-placed',
      sourceDef: img.def,
      sourceIndex: -1,
      placedIndex: placedIdx,
      currentX: pos.x,
      currentY: pos.y,
      offsetX: pos.x - img.x,
      offsetY: pos.y - img.y,
      width: img.width,
      height: img.height,
      growProgress: 1,
    }
    containerEl.style.cursor = 'grabbing'
    e.preventDefault()
    render()
    return
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  const pos = getEventPos(e)
  const isTouch = 'touches' in e

  if (dragState.phase === 'floating-from-tray') {
    e.preventDefault()
    dragState.currentX = pos.x
    dragState.currentY = pos.y
    if (!isGrowing) requestAnimationFrame(render)
    return
  }

  if (dragState.phase === 'dragging-placed') {
    e.preventDefault()
    dragState.currentX = pos.x
    dragState.currentY = pos.y
    requestAnimationFrame(render)
    return
  }

  // Idle — auto-grab when mouse is in the newspaper text area (desktop only)
  if (!isTouch && !isMobile && dragState.phase === 'idle') {
    const trayTop = canvasHeight - TRAY_HEIGHT

    // If mouse is in the newspaper area (above tray) and we haven't auto-grabbed yet,
    // or if mouse is hovering a tray thumbnail, auto-grab
    if (pos.y < trayTop && pos.y > 0 && !hasAutoGrabbed) {
      const nextIdx = getNextAvailableTrayIndex()
      if (nextIdx >= 0) {
        hasAutoGrabbed = true
        startFloatingFromTray(nextIdx, pos.x, pos.y)
        return
      }
    }

    // Also auto-grab on tray hover
    const trayIdx = hitTestTray(pos.x, pos.y)
    if (trayIdx >= 0 && trayAvailable[trayIdx]) {
      startFloatingFromTray(trayIdx, pos.x, pos.y)
      return
    }

    // Update cursor
    const overPlaced = hitTestPlaced(pos.x, pos.y) >= 0
    containerEl.style.cursor = overPlaced ? 'grab' : 'default'
  }
}

function onPointerUp(e: MouseEvent | TouchEvent) {
  if (dragState.phase === 'dragging-placed') {
    const img = placedImages[dragState.placedIndex]!
    img.x = dragState.currentX - dragState.offsetX
    img.y = dragState.currentY - dragState.offsetY
    dragState = {
      phase: 'idle', sourceDef: null, sourceIndex: -1, placedIndex: -1,
      currentX: 0, currentY: 0, offsetX: 0, offsetY: 0,
      width: 0, height: 0, growProgress: 1,
    }
    containerEl.style.cursor = 'default'
    render()
    return
  }

  // For floating-from-tray on touch: place on touchend
  if (dragState.phase === 'floating-from-tray' && 'changedTouches' in e && dragState.sourceDef) {
    const pos = getEventPos(e)
    const trayTop = canvasHeight - TRAY_HEIGHT
    if (pos.y < trayTop - 10) {
      const scale = dragState.growProgress
      const w = dragState.width * scale
      const h = dragState.height * scale
      placedImages.push({
        def: dragState.sourceDef,
        x: pos.x - w / 2,
        y: pos.y - h / 2,
        width: w,
        height: h,
      })
      trayAvailable[dragState.sourceIndex] = false
    }
    dragState = {
      phase: 'idle', sourceDef: null, sourceIndex: -1, placedIndex: -1,
      currentX: 0, currentY: 0, offsetX: 0, offsetY: 0,
      width: 0, height: 0, growProgress: 1,
    }
    isGrowing = false
    containerEl.style.cursor = 'default'
    render()
  }
}

function onMouseLeave() {
  // Reset auto-grab so re-entering triggers it again
  hasAutoGrabbed = false

  // If floating from tray and mouse leaves, cancel
  if (dragState.phase === 'floating-from-tray') {
    dragState = {
      phase: 'idle', sourceDef: null, sourceIndex: -1, placedIndex: -1,
      currentX: 0, currentY: 0, offsetX: 0, offsetY: 0,
      width: 0, height: 0, growProgress: 1,
    }
    isGrowing = false
    containerEl.style.cursor = 'default'
    render()
  }
  if (dragState.phase === 'dragging-placed') {
    const img = placedImages[dragState.placedIndex]!
    img.x = dragState.currentX - dragState.offsetX
    img.y = dragState.currentY - dragState.offsetY
    dragState = {
      phase: 'idle', sourceDef: null, sourceIndex: -1, placedIndex: -1,
      currentX: 0, currentY: 0, offsetX: 0, offsetY: 0,
      width: 0, height: 0, growProgress: 1,
    }
    containerEl.style.cursor = 'default'
    render()
  }
}

function onDoubleClick(e: MouseEvent) {
  const pos = getEventPos(e)
  const placedIdx = hitTestPlaced(pos.x, pos.y)
  if (placedIdx >= 0) {
    const img = placedImages[placedIdx]!
    const trayIdx = TRAY_IMAGES.findIndex(t => t.id === img.def.id)
    if (trayIdx >= 0) trayAvailable[trayIdx] = true
    placedImages.splice(placedIdx, 1)
    render()
  }
}

// --- Pre-place initial images ---

function placeInitialImages() {
  const config = getResponsiveConfig(canvasWidth)
  const contentTop = PADDING + MASTHEAD_HEIGHT
  const totalTextWidth = canvasWidth - PADDING * 2 - COL_GAP * (config.columns - 1)
  const colWidth = totalTextWidth / config.columns

  if (config.columns >= 3) {
    // Place skyline in first column, right side
    const img0 = TRAY_IMAGES[0]!
    const w0 = img0.placedWidth * config.imageScale
    const h0 = img0.placedHeight * config.imageScale
    placedImages.push({
      def: img0,
      x: PADDING + colWidth - w0 - 4,
      y: contentTop + LINE_HEIGHT * 3,
      width: w0,
      height: h0,
    })
    trayAvailable[0] = false

    // Place grid in third column
    const img2 = TRAY_IMAGES[2]!
    const w2 = img2.placedWidth * config.imageScale
    const h2 = img2.placedHeight * config.imageScale
    placedImages.push({
      def: img2,
      x: PADDING + 2 * (colWidth + COL_GAP) + 4,
      y: contentTop + LINE_HEIGHT * 5,
      width: w2,
      height: h2,
    })
    trayAvailable[2] = false
  } else if (config.columns === 2) {
    const img0 = TRAY_IMAGES[0]!
    const w0 = img0.placedWidth * config.imageScale
    const h0 = img0.placedHeight * config.imageScale
    placedImages.push({
      def: img0,
      x: PADDING + colWidth - w0 - 4,
      y: contentTop + LINE_HEIGHT * 4,
      width: w0,
      height: h0,
    })
    trayAvailable[0] = false
  }
}

// --- Init ---

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  // Make the content area full-bleed
  const contentArea = content.closest('.content') as HTMLElement | null
  if (contentArea) contentArea.classList.add('content--newspaper')

  await waitForFonts()

  trayAvailable = TRAY_IMAGES.map(() => true)
  prepared = prepareWithSegments(NEWSPAPER_TEXT, FONT)

  // Canvas fills the visible area, below-fold content is outside
  content.innerHTML = `
    <div id="newspaper-wrap" style="position:relative;">
      <canvas id="newspaper-canvas" style="width:100%;display:block;"></canvas>
    </div>

    <div class="newspaper-below-fold">
      <div style="text-align:center;margin-bottom:var(--space-12);">
        <p style="font-size:var(--text-lg);color:var(--color-text-secondary);max-width:600px;margin:0 auto var(--space-4);">
          Everything above is canvas-rendered using pretext's <code style="color:var(--color-accent);font-family:var(--font-code);font-size:0.9em;">layoutNextLine()</code> API.
        </p>
        <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);max-width:520px;margin:0 auto var(--space-6);">
          No DOM reflow. No hidden elements. Just arithmetic over cached glyph widths — fast enough to recompute every character position on every frame of a drag.
        </p>
        <a href="/pages/editorial.html" style="color:var(--color-accent);font-size:var(--text-sm);font-weight:var(--font-weight-semibold);text-decoration:none;">
          See the source code &rarr;
        </a>
      </div>

      <h2 style="text-align:center;margin-bottom:var(--space-6);font-size:var(--text-xl);">Explore by track</h2>

      <div class="track-grid" style="margin-bottom:var(--space-4);">
        ${tracks.map(t => `
          <a href="${t.pages[0]!.href}" class="track-card">
            <div class="track-card__title">${t.title}</div>
            <div class="track-card__desc">${t.pages.length} ${t.pages.length === 1 ? 'page' : 'pages'}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `

  containerEl = document.getElementById('newspaper-wrap')!
  canvasEl = document.getElementById('newspaper-canvas') as HTMLCanvasElement
  ctx = canvasEl.getContext('2d')!

  // Size canvas to fill the viewport (minus header)
  function setCanvasHeight() {
    const headerH = 52 // var(--header-height)
    const viewH = window.innerHeight - headerH
    canvasEl.style.height = `${viewH}px`
    containerEl.style.height = `${viewH}px`
  }
  setCanvasHeight()
  window.addEventListener('resize', setCanvasHeight)

  // Detect mobile
  isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Do an initial size so placeInitialImages can use canvasWidth/canvasHeight
  sizeCanvas()
  if (!isMobile) placeInitialImages()

  // Events
  canvasEl.addEventListener('mousedown', onPointerDown)
  canvasEl.addEventListener('mousemove', onPointerMove)
  canvasEl.addEventListener('mouseup', onPointerUp)
  canvasEl.addEventListener('mouseleave', onMouseLeave)
  canvasEl.addEventListener('dblclick', onDoubleClick)
  canvasEl.addEventListener('touchstart', onPointerDown, { passive: false })
  canvasEl.addEventListener('touchmove', onPointerMove, { passive: false })
  canvasEl.addEventListener('touchend', onPointerUp)

  new ResizeObserver(() => {
    if (dragState.phase === 'idle' && !isRevealing && !isDrifting) render()
  }).observe(containerEl)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    if (isMobile) startDrift()
    render()
  } else {
    isRevealing = true
    revealProgress = 0
    requestAnimationFrame(animateEntrance)
  }
}

init()
