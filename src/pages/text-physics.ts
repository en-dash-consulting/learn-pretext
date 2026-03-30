import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const PHYSICS_TEXT =
  'Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.'

const CHAR_FONT = '20px Inter'
const CHAR_LINE_HEIGHT = 28

const RESTITUTION = 0.7
const FRICTION = 0.995
const GRAVITY_WELL_STRENGTH = 8000
const EARTH_G = 400
const MAX_VELOCITY = 800

type GravityMode = 'zero' | 'earth' | 'accelerometer'

interface PhysicsChar {
  char: string
  width: number
  radius: number
  // Current position (Verlet: store current and previous)
  x: number
  y: number
  prevX: number
  prevY: number
  // Home position
  homeX: number
  homeY: number
  mass: number
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Text Physics</h1>
      <p class="content__subtitle">A physics playground where characters have mass, gravity, and collision. Click to create gravity wells, drag to fling characters. Powered by <span class="api-tag">prepareWithSegments()</span>.</p>
    </div>

    <div class="content__section">
      <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;">
        <button id="gravity-toggle" class="btn btn--primary" style="min-width:160px;">Zero G</button>
        <button id="reset-btn" class="btn btn--secondary">Reset</button>
        <div id="velocity-legend" style="display:flex;align-items:center;gap:var(--space-2);margin-left:auto;font-size:var(--text-sm);color:var(--color-text-secondary);">
          <span>Slow</span>
          <div style="width:100px;height:8px;border-radius:4px;background:linear-gradient(to right,#60a5fa,#a78bfa,#fb7185);"></div>
          <span>Fast</span>
        </div>
      </div>
      <div class="demo-area demo-area--full" style="height:500px;position:relative;overflow:hidden;cursor:crosshair;touch-action:none;" id="physics-wrapper">
        <canvas id="physics-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <p style="margin-top:var(--space-2);font-size:var(--text-sm);color:var(--color-text-tertiary);">Click to create a gravity well. Click and drag to fling characters. On mobile, try tilting your device.</p>
      <div id="physics-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const wrapper = document.getElementById('physics-wrapper')!
  const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const gravityBtn = document.getElementById('gravity-toggle')!
  const resetBtn = document.getElementById('reset-btn')!

  let canvasWidth = 0
  let canvasHeight = 0

  function setupCanvas() {
    const rect = wrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    canvasWidth = rect.width
    canvasHeight = rect.height
  }

  setupCanvas()

  // Measure characters with pretext
  const prepared = prepareWithSegments(PHYSICS_TEXT, CHAR_FONT)
  const linesResult = layoutWithLines(prepared, canvasWidth - 40, CHAR_LINE_HEIGHT)

  // Build physics characters from pretext measurements
  const measureCtx = document.createElement('canvas').getContext('2d')!
  measureCtx.font = CHAR_FONT

  const chars: PhysicsChar[] = []
  let segIdx = 0

  linesResult.lines.forEach((line, lineIdx) => {
    let x = 20
    const y = 60 + lineIdx * CHAR_LINE_HEIGHT

    // Walk through segment data to get per-character widths
    for (const ch of line.text) {
      if (ch === ' ') {
        x += measureCtx.measureText(' ').width
        continue
      }
      const charWidth = measureCtx.measureText(ch).width
      const radius = Math.max(charWidth / 2, 5)
      chars.push({
        char: ch,
        width: charWidth,
        radius,
        x,
        y,
        prevX: x,
        prevY: y,
        homeX: x,
        homeY: y,
        mass: charWidth * 0.1, // heavier chars = wider chars
      })
      x += charWidth
    }
  })

  // Gravity state
  let gravityMode: GravityMode = 'zero'
  let gravityX = 0
  let gravityY = 0
  let accelX = 0
  let accelY = 0
  let hasAccelerometer = false

  // Mouse/touch state
  let pointerDown = false
  let pointerX = 0
  let pointerY = 0
  let wellActive = false
  let dragStartX = 0
  let dragStartY = 0

  // Gravity button
  function updateGravityLabel() {
    const labels: Record<GravityMode, string> = {
      zero: 'Zero G',
      earth: 'Earth G',
      accelerometer: 'Accelerometer',
    }
    gravityBtn.textContent = labels[gravityMode]
  }

  gravityBtn.addEventListener('click', () => {
    if (gravityMode === 'zero') {
      gravityMode = 'earth'
    } else if (gravityMode === 'earth') {
      if (hasAccelerometer) {
        gravityMode = 'accelerometer'
        requestAccelerometer()
      } else {
        gravityMode = 'zero'
      }
    } else {
      gravityMode = 'zero'
    }
    updateGravityLabel()
  })

  // Check for accelerometer
  if ('DeviceOrientationEvent' in window) {
    hasAccelerometer = true
  }

  function requestAccelerometer() {
    const DOE = DeviceOrientationEvent as any
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then((response: string) => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation)
        }
      })
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }
  }

  function handleOrientation(e: DeviceOrientationEvent) {
    if (gravityMode !== 'accelerometer') return
    // beta: front-back tilt (-180..180), gamma: left-right tilt (-90..90)
    const beta = (e.beta ?? 0) * (Math.PI / 180)
    const gamma = (e.gamma ?? 0) * (Math.PI / 180)
    accelX = Math.sin(gamma) * EARTH_G * 2
    accelY = Math.sin(beta) * EARTH_G * 2
  }

  // Pointer events
  function getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  canvas.addEventListener('mousedown', (e) => {
    const pos = getCanvasPos(e)
    pointerDown = true
    pointerX = pos.x
    pointerY = pos.y
    dragStartX = pos.x
    dragStartY = pos.y
    wellActive = true
  })

  canvas.addEventListener('mousemove', (e) => {
    const pos = getCanvasPos(e)
    pointerX = pos.x
    pointerY = pos.y
    if (pointerDown) {
      wellActive = true
    }
  })

  canvas.addEventListener('mouseup', () => {
    pointerDown = false
    wellActive = false
  })

  canvas.addEventListener('mouseleave', () => {
    pointerDown = false
    wellActive = false
  })

  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const touch = e.touches[0]!
    const pos = getCanvasPos(touch)
    pointerDown = true
    pointerX = pos.x
    pointerY = pos.y
    dragStartX = pos.x
    dragStartY = pos.y
    wellActive = true
  })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const touch = e.touches[0]!
    const pos = getCanvasPos(touch)
    pointerX = pos.x
    pointerY = pos.y
  })

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault()
    pointerDown = false
    wellActive = false
  })

  // Reset
  resetBtn.addEventListener('click', () => {
    chars.forEach((ch) => {
      ch.x = ch.homeX
      ch.y = ch.homeY
      ch.prevX = ch.homeX
      ch.prevY = ch.homeY
    })
  })

  // Resize
  new ResizeObserver(() => {
    setupCanvas()
  }).observe(wrapper)

  // Velocity color
  function velocityColor(vx: number, vy: number): string {
    const speed = Math.sqrt(vx * vx + vy * vy)
    const t = Math.min(speed / 300, 1)
    // Blue -> Purple -> Red
    if (t < 0.5) {
      const s = t * 2
      const r = Math.round(96 + s * (167 - 96))
      const g = Math.round(165 + s * (139 - 165))
      const b = Math.round(250 + s * (250 - 250))
      return `rgb(${r},${g},${b})`
    } else {
      const s = (t - 0.5) * 2
      const r = Math.round(167 + s * (251 - 167))
      const g = Math.round(139 + s * (113 - 139))
      const b = Math.round(250 + s * (133 - 250))
      return `rgb(${r},${g},${b})`
    }
  }

  // Physics step (Verlet integration)
  let lastTime = performance.now()

  function step(now: number) {
    const rawDt = (now - lastTime) / 1000
    const dt = Math.min(rawDt, 1 / 30) // cap at ~30fps worth of physics
    lastTime = now

    for (const ch of chars) {
      // Compute velocity from positions
      let vx = (ch.x - ch.prevX) / dt
      let vy = (ch.y - ch.prevY) / dt

      // Clamp velocity
      const speed = Math.sqrt(vx * vx + vy * vy)
      if (speed > MAX_VELOCITY) {
        vx = (vx / speed) * MAX_VELOCITY
        vy = (vy / speed) * MAX_VELOCITY
      }

      // Gravity
      let gx = 0
      let gy = 0

      if (gravityMode === 'earth') {
        gy = EARTH_G
      } else if (gravityMode === 'accelerometer') {
        gx = accelX
        gy = accelY
      }

      // Gravity well
      if (wellActive) {
        const dx = pointerX - ch.x
        const dy = pointerY - ch.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 10 // avoid singularity
        const force = GRAVITY_WELL_STRENGTH / (dist * dist)
        const cappedForce = Math.min(force, 2000)
        gx += (dx / dist) * cappedForce
        gy += (dy / dist) * cappedForce
      }

      // Desktop: subtle gravity toward mouse when not clicking
      if (!wellActive && gravityMode === 'zero') {
        const dx = pointerX - ch.x
        const dy = pointerY - ch.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 50
        gx += (dx / dist) * 15
        gy += (dy / dist) * 15
      }

      // Verlet integration
      const newX = ch.x + vx * dt + gx * dt * dt
      const newY = ch.y + vy * dt + gy * dt * dt

      ch.prevX = ch.x
      ch.prevY = ch.y
      ch.x = newX
      ch.y = newY

      // Apply friction
      ch.prevX = ch.x - (ch.x - ch.prevX) * FRICTION
      ch.prevY = ch.y - (ch.y - ch.prevY) * FRICTION

      // Wall collisions
      const margin = ch.radius
      if (ch.x < margin) {
        ch.x = margin
        ch.prevX = ch.x + (ch.x - ch.prevX) * RESTITUTION
      }
      if (ch.x > canvasWidth - margin) {
        ch.x = canvasWidth - margin
        ch.prevX = ch.x + (ch.x - ch.prevX) * RESTITUTION
      }
      if (ch.y < margin) {
        ch.y = margin
        ch.prevY = ch.y + (ch.y - ch.prevY) * RESTITUTION
      }
      if (ch.y > canvasHeight - margin) {
        ch.y = canvasHeight - margin
        ch.prevY = ch.y + (ch.y - ch.prevY) * RESTITUTION
      }
    }

    // Simple O(n^2) collision — fine for ~120 chars
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const a = chars[i]!
        const b = chars[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = a.radius + b.radius

        if (dist < minDist && dist > 0.01) {
          // Separate
          const overlap = (minDist - dist) / 2
          const nx = dx / dist
          const ny = dy / dist

          const totalMass = a.mass + b.mass
          const ratioA = b.mass / totalMass
          const ratioB = a.mass / totalMass

          a.x -= nx * overlap * ratioA
          a.y -= ny * overlap * ratioA
          b.x += nx * overlap * ratioB
          b.y += ny * overlap * ratioB

          // Exchange velocity along collision normal (simplified)
          const aDotN = ((a.x - a.prevX) * nx + (a.y - a.prevY) * ny)
          const bDotN = ((b.x - b.prevX) * nx + (b.y - b.prevY) * ny)

          a.prevX += (aDotN - bDotN) * nx * RESTITUTION * ratioA
          a.prevY += (aDotN - bDotN) * ny * RESTITUTION * ratioA
          b.prevX -= (bDotN - aDotN) * nx * RESTITUTION * ratioB
          b.prevY -= (bDotN - aDotN) * ny * RESTITUTION * ratioB
        }
      }
    }
  }

  // Render
  function render(now: number) {
    setupCanvas()
    step(now)

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Background
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw gravity well indicator
    if (wellActive) {
      const gradient = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 120)
      gradient.addColorStop(0, 'rgba(129, 140, 248, 0.15)')
      gradient.addColorStop(1, 'rgba(129, 140, 248, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(pointerX, pointerY, 120, 0, Math.PI * 2)
      ctx.fill()

      // Crosshair
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pointerX - 10, pointerY)
      ctx.lineTo(pointerX + 10, pointerY)
      ctx.moveTo(pointerX, pointerY - 10)
      ctx.lineTo(pointerX, pointerY + 10)
      ctx.stroke()
    }

    // Draw characters
    ctx.font = CHAR_FONT
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    for (const ch of chars) {
      const vx = ch.x - ch.prevX
      const vy = ch.y - ch.prevY
      const color = velocityColor(vx / (1 / 60), vy / (1 / 60))

      // Subtle glow for fast chars
      const speed = Math.sqrt(vx * vx + vy * vy) * 60
      if (speed > 100) {
        ctx.globalAlpha = Math.min((speed - 100) / 400, 0.3)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(ch.x, ch.y, ch.radius * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.fillStyle = color
      ctx.fillText(ch.char, ch.x, ch.y)
    }

    // Hint
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#888'
    ctx.font = '12px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${chars.length} characters | ${gravityMode === 'zero' ? 'Click to pull' : gravityMode === 'earth' ? 'Gravity on' : 'Tilt device'}`, 12, canvasHeight - 8)
    ctx.globalAlpha = 1

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)

  // Source viewer
  await createSourceViewer(document.getElementById('physics-source')!, {
    code: `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '20px Inter')
const { lines } = layoutWithLines(prepared, maxWidth, 28)

// Build physics characters with pretext-measured widths
const chars: PhysicsChar[] = []
lines.forEach((line, lineIdx) => {
  let x = 0
  for (const ch of line.text) {
    const charWidth = ctx.measureText(ch).width
    chars.push({
      char: ch,
      width: charWidth,
      radius: charWidth / 2,
      x, y: lineIdx * 28,
      prevX: x, prevY: lineIdx * 28,  // Verlet needs prev position
      mass: charWidth * 0.1,           // wider chars = heavier
    })
    x += charWidth
  }
})

// Verlet integration step
function step(dt: number) {
  for (const ch of chars) {
    const vx = ch.x - ch.prevX
    const vy = ch.y - ch.prevY

    // Gravity well: inverse-square attraction to click
    if (wellActive) {
      const dx = pointerX - ch.x
      const dy = pointerY - ch.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 10
      const force = GRAVITY_WELL_STRENGTH / (dist * dist)
      gx += (dx / dist) * force
      gy += (dy / dist) * force
    }

    // Verlet update
    ch.prevX = ch.x
    ch.prevY = ch.y
    ch.x += vx + gx * dt * dt
    ch.y += vy + gy * dt * dt

    // Wall bounce with energy loss
    if (ch.x < ch.radius) {
      ch.x = ch.radius
      ch.prevX = ch.x + (ch.x - ch.prevX) * 0.7
    }
  }

  // O(n^2) circle collision between characters
  for (let i = 0; i < chars.length; i++)
    for (let j = i + 1; j < chars.length; j++) {
      // Separate overlapping circles & exchange momentum
    }
}`,
    title: 'Physics Implementation',
  })
}

init()
