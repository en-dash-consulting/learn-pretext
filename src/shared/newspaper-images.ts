export interface TrayImageDef {
  id: string
  label: string
  placedWidth: number
  placedHeight: number
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void
}

function drawSkyline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Night sky gradient
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, '#1a1a3e')
  grad.addColorStop(1, '#2d1b4e')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  const seed = [0.12, 0.34, 0.67, 0.89, 0.23, 0.56, 0.78, 0.45, 0.91, 0.15]
  for (let i = 0; i < seed.length; i++) {
    const sx = x + seed[i]! * w
    const sy = y + seed[(i + 3) % seed.length]! * h * 0.5
    ctx.fillRect(sx, sy, 1.5, 1.5)
  }

  // Buildings
  const buildings = [
    { xOff: 0.05, width: 0.12, height: 0.55, color: '#4a4a8a' },
    { xOff: 0.15, width: 0.10, height: 0.70, color: '#5b5ba0' },
    { xOff: 0.24, width: 0.14, height: 0.45, color: '#40407a' },
    { xOff: 0.36, width: 0.08, height: 0.85, color: '#6e6ec0' },
    { xOff: 0.43, width: 0.15, height: 0.60, color: '#5252a8' },
    { xOff: 0.56, width: 0.11, height: 0.75, color: '#5b5bb0' },
    { xOff: 0.65, width: 0.16, height: 0.50, color: '#4848a0' },
    { xOff: 0.80, width: 0.12, height: 0.65, color: '#5858b8' },
  ]

  for (const b of buildings) {
    const bx = x + b.xOff * w
    const bw = b.width * w
    const bh = b.height * h
    const by = y + h - bh
    ctx.fillStyle = b.color
    ctx.fillRect(bx, by, bw, bh)

    // Windows
    ctx.fillStyle = 'rgba(255,220,100,0.3)'
    const winSize = Math.max(2, bw * 0.15)
    const winGap = winSize * 2
    for (let wy = by + winGap; wy < y + h - winGap; wy += winGap) {
      for (let wx = bx + winGap * 0.5; wx < bx + bw - winSize; wx += winGap) {
        if (Math.sin(wx * 13 + wy * 7) > 0.1) {
          ctx.fillRect(wx, wy, winSize, winSize * 0.8)
        }
      }
    }
  }
}

function drawWaves(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Ocean background
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, '#0c2d48')
  grad.addColorStop(1, '#145369')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  const waves = [
    { yOff: 0.25, amplitude: 0.08, frequency: 2.5, color: 'rgba(52,211,153,0.25)', lineWidth: 2.5 },
    { yOff: 0.40, amplitude: 0.10, frequency: 2.0, color: 'rgba(52,211,153,0.35)', lineWidth: 2 },
    { yOff: 0.55, amplitude: 0.07, frequency: 3.0, color: 'rgba(96,230,180,0.30)', lineWidth: 2 },
    { yOff: 0.70, amplitude: 0.12, frequency: 1.8, color: 'rgba(52,211,153,0.40)', lineWidth: 2.5 },
    { yOff: 0.85, amplitude: 0.06, frequency: 3.5, color: 'rgba(120,240,200,0.25)', lineWidth: 1.5 },
  ]

  for (const wave of waves) {
    ctx.beginPath()
    ctx.strokeStyle = wave.color
    ctx.lineWidth = wave.lineWidth
    const baseY = y + wave.yOff * h
    const amp = wave.amplitude * h
    for (let px = 0; px <= w; px += 2) {
      const wy = baseY + Math.sin((px / w) * Math.PI * wave.frequency) * amp
      if (px === 0) ctx.moveTo(x + px, wy)
      else ctx.lineTo(x + px, wy)
    }
    ctx.stroke()
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Mondrian-style grid
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(x, y, w, h)

  const lineW = Math.max(2, w * 0.03)

  const cells = [
    { cx: 0, cy: 0, cw: 0.45, ch: 0.55, color: '#c23b22' },
    { cx: 0.45, cy: 0, cw: 0.55, ch: 0.35, color: '#2855a1' },
    { cx: 0.45, cy: 0.35, cw: 0.30, ch: 0.20, color: '#f5f0e8' },
    { cx: 0.75, cy: 0.35, cw: 0.25, ch: 0.65, color: '#f2c318' },
    { cx: 0, cy: 0.55, cw: 0.20, ch: 0.45, color: '#f5f0e8' },
    { cx: 0.20, cy: 0.55, cw: 0.25, ch: 0.45, color: '#2855a1' },
    { cx: 0.45, cy: 0.55, cw: 0.30, ch: 0.45, color: '#f5f0e8' },
  ]

  for (const c of cells) {
    ctx.fillStyle = c.color
    ctx.fillRect(x + c.cx * w + lineW / 2, y + c.cy * h + lineW / 2, c.cw * w - lineW, c.ch * h - lineW)
  }

  // Grid lines
  ctx.fillStyle = '#1a1a1a'
  // Horizontal
  ctx.fillRect(x, y + 0.55 * h - lineW / 2, w, lineW)
  ctx.fillRect(x + 0.45 * w, y + 0.35 * h - lineW / 2, 0.55 * w, lineW)
  // Vertical
  ctx.fillRect(x + 0.45 * w - lineW / 2, y, lineW, h)
  ctx.fillRect(x + 0.75 * w - lineW / 2, y + 0.35 * h, lineW, 0.65 * h)
  ctx.fillRect(x + 0.20 * w - lineW / 2, y + 0.55 * h, lineW, 0.45 * h)
  // Border
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = lineW
  ctx.strokeRect(x + lineW / 2, y + lineW / 2, w - lineW, h - lineW)
}

function drawMountains(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Night sky
  const skyGrad = ctx.createLinearGradient(x, y, x, y + h * 0.6)
  skyGrad.addColorStop(0, '#0a0a1a')
  skyGrad.addColorStop(1, '#1a1535')
  ctx.fillStyle = skyGrad
  ctx.fillRect(x, y, w, h)

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  const stars = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.15, 0.6, 0.35, 0.8, 0.05, 0.5, 0.9, 0.3, 0.75]
  for (let i = 0; i < stars.length; i++) {
    const sx = x + stars[i]! * w
    const sy = y + stars[(i + 5) % stars.length]! * h * 0.45
    const size = 1 + (i % 3) * 0.5
    ctx.fillRect(sx, sy, size, size)
  }

  // Back mountain
  const mGrad1 = ctx.createLinearGradient(x, y + h * 0.25, x, y + h)
  mGrad1.addColorStop(0, '#3d3560')
  mGrad1.addColorStop(1, '#1a1530')
  ctx.fillStyle = mGrad1
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x + w * 0.15, y + h * 0.45)
  ctx.lineTo(x + w * 0.35, y + h * 0.25)
  ctx.lineTo(x + w * 0.55, y + h * 0.50)
  ctx.lineTo(x + w * 0.75, y + h * 0.30)
  ctx.lineTo(x + w, y + h * 0.55)
  ctx.lineTo(x + w, y + h)
  ctx.fill()

  // Front mountain
  const mGrad2 = ctx.createLinearGradient(x, y + h * 0.4, x, y + h)
  mGrad2.addColorStop(0, '#2a2248')
  mGrad2.addColorStop(1, '#15102a')
  ctx.fillStyle = mGrad2
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + h * 0.60)
  ctx.lineTo(x + w * 0.25, y + h * 0.40)
  ctx.lineTo(x + w * 0.50, y + h * 0.65)
  ctx.lineTo(x + w * 0.70, y + h * 0.42)
  ctx.lineTo(x + w * 0.90, y + h * 0.58)
  ctx.lineTo(x + w, y + h * 0.50)
  ctx.lineTo(x + w, y + h)
  ctx.fill()

  // Snow caps
  ctx.fillStyle = 'rgba(220,220,240,0.3)'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.30, y + h * 0.27)
  ctx.lineTo(x + w * 0.35, y + h * 0.25)
  ctx.lineTo(x + w * 0.40, y + h * 0.30)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x + w * 0.70, y + h * 0.32)
  ctx.lineTo(x + w * 0.75, y + h * 0.30)
  ctx.lineTo(x + w * 0.80, y + h * 0.35)
  ctx.fill()
}

function drawTypography(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Dark background
  ctx.fillStyle = '#10101a'
  ctx.fillRect(x, y, w, h)

  // Accent halo
  const haloGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.45)
  haloGrad.addColorStop(0, 'rgba(129,140,248,0.2)')
  haloGrad.addColorStop(0.6, 'rgba(129,140,248,0.05)')
  haloGrad.addColorStop(1, 'rgba(129,140,248,0)')
  ctx.fillStyle = haloGrad
  ctx.fillRect(x, y, w, h)

  // Large "Aa"
  const fontSize = Math.min(w * 0.45, h * 0.55)
  ctx.font = `700 ${fontSize}px Inter`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#818cf8'
  ctx.fillText('Aa', x + w / 2, y + h / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  // Decorative baseline
  const lineY = y + h / 2 + fontSize * 0.35
  ctx.strokeStyle = 'rgba(129,140,248,0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(x + w * 0.1, lineY)
  ctx.lineTo(x + w * 0.9, lineY)
  ctx.stroke()
  ctx.setLineDash([])

  // Small label
  const labelSize = Math.max(8, fontSize * 0.15)
  ctx.font = `400 ${labelSize}px Inter`
  ctx.fillStyle = 'rgba(129,140,248,0.5)'
  ctx.textAlign = 'center'
  ctx.fillText('TYPEFACE', x + w / 2, y + h * 0.82)
  ctx.textAlign = 'left'
}

export const TRAY_IMAGES: TrayImageDef[] = [
  { id: 'skyline', label: 'Fig. 1', placedWidth: 160, placedHeight: 120, draw: drawSkyline },
  { id: 'waves', label: 'Fig. 2', placedWidth: 150, placedHeight: 110, draw: drawWaves },
  { id: 'grid', label: 'Fig. 3', placedWidth: 140, placedHeight: 140, draw: drawGrid },
  { id: 'mountains', label: 'Fig. 4', placedWidth: 155, placedHeight: 115, draw: drawMountains },
  { id: 'typography', label: 'Fig. 5', placedWidth: 135, placedHeight: 120, draw: drawTypography },
]
