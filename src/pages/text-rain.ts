import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const SOURCE_TEXT =
  'In the beginning was the Word, and the Word was with God, and the Word was God. ' +
  'The same was in the beginning with God. All things were made by him; and without him was not any thing made that was made. ' +
  'In him was life; and the life was the light of men. And the light shineth in darkness; and the darkness comprehended it not. ' +
  'There was a man sent from God, whose name was John. The same came for a witness, to bear witness of the Light, ' +
  'that all men through him might believe. He was not that Light, but was sent to bear witness of that Light. ' +
  'That was the true Light, which lighteth every man that cometh into the world.'

const CHAR_FONT = '18px Inter'
const CAUGHT_FONT = '14px Inter'
const CAUGHT_LINE_HEIGHT = 20

interface FallingChar {
  char: string
  x: number
  y: number
  vy: number
  width: number
  drift: number
  opacity: number
  index: number // position in original text
  caught: boolean
  trail: number[] // previous y positions for blur effect
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Text Rain</h1>
      <p class="content__subtitle">Characters rain down and collect on your platform. Catch them in order to reconstruct the text. Measured with <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutWithLines()</span>.</p>
    </div>

    <div class="content__section">
      <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;align-items:center;">
        <button id="rain-reset" class="btn btn--secondary">Restart</button>
        <div id="rain-score" style="font-size:var(--text-sm);color:var(--color-text-secondary);font-family:var(--font-code);">Caught: 0 | Missed: 0</div>
        <div id="rain-speed" style="margin-left:auto;font-size:var(--text-sm);color:var(--color-text-tertiary);">Speed: 1x</div>
      </div>
      <div class="demo-area demo-area--full" style="height:560px;position:relative;overflow:hidden;cursor:none;touch-action:none;" id="rain-wrapper">
        <canvas id="rain-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <p style="margin-top:var(--space-2);font-size:var(--text-sm);color:var(--color-text-tertiary);">Move your mouse or finger to position the platform. Catch the falling characters to build the text.</p>
      <div id="rain-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const wrapper = document.getElementById('rain-wrapper')!
  const canvas = document.getElementById('rain-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const resetBtn = document.getElementById('rain-reset')!
  const scoreEl = document.getElementById('rain-score')!
  const speedEl = document.getElementById('rain-speed')!

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

  // Measure character widths with pretext
  const charWidthMap: Map<string, number> = new Map()
  const uniqueChars = new Set(SOURCE_TEXT)

  for (const char of uniqueChars) {
    if (char === ' ') {
      const prepared = prepareWithSegments('a a', CHAR_FONT)
      charWidthMap.set(' ', prepared.widths[1] ?? 4)
    } else {
      const prepared = prepareWithSegments(char, CHAR_FONT)
      charWidthMap.set(char, prepared.widths[0] ?? 10)
    }
  }

  // Game state
  const PLATFORM_WIDTH = 180
  const PLATFORM_HEIGHT = 6
  const COLLECTION_HEIGHT = 140
  const PLAY_AREA_HEIGHT_RATIO = 0.75

  let platformX = canvasWidth / 2
  let caught = 0
  let missed = 0
  let caughtText = ''
  let fallingChars: FallingChar[] = []
  let nextCharIndex = 0
  let spawnTimer = 0
  let speedMultiplier = 1
  let gameTime = 0
  let baseSpawnRate = 0.6 // seconds between spawns
  let baseFallSpeed = 80

  // Accelerometer support
  let accelDrift = 0
  if ('DeviceOrientationEvent' in window) {
    const DOE = DeviceOrientationEvent as any
    if (typeof DOE.requestPermission === 'function') {
      // iOS: defer until user gesture
      wrapper.addEventListener('touchstart', () => {
        DOE.requestPermission().then((r: string) => {
          if (r === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          }
        })
      }, { once: true })
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }
  }

  function handleOrientation(e: DeviceOrientationEvent) {
    const gamma = e.gamma ?? 0
    accelDrift = gamma * 0.5 // shift falling chars based on tilt
  }

  // Platform tracking
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect()
    platformX = e.clientX - rect.left
  })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    platformX = e.touches[0]!.clientX - rect.left
  })

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    platformX = e.touches[0]!.clientX - rect.left
  })

  canvas.addEventListener('mouseenter', () => {
    canvas.style.cursor = 'none'
  })

  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default'
  })

  // Reset
  function reset() {
    fallingChars = []
    caughtText = ''
    caught = 0
    missed = 0
    nextCharIndex = 0
    spawnTimer = 0
    speedMultiplier = 1
    gameTime = 0
    baseSpawnRate = 0.6
  }

  resetBtn.addEventListener('click', reset)

  new ResizeObserver(() => {
    setupCanvas()
  }).observe(wrapper)

  // Spawn a new falling character
  function spawnChar() {
    if (nextCharIndex >= SOURCE_TEXT.length) {
      nextCharIndex = 0 // loop
    }

    const char = SOURCE_TEXT[nextCharIndex]!
    const width = charWidthMap.get(char) ?? 10

    // Random X position, but keep on screen
    const x = 20 + Math.random() * (canvasWidth - 40)
    const speed = baseFallSpeed * speedMultiplier * (0.8 + Math.random() * 0.4)

    fallingChars.push({
      char,
      x,
      y: -20,
      vy: speed,
      width,
      drift: (Math.random() - 0.5) * 20 + accelDrift,
      opacity: 1,
      index: nextCharIndex,
      caught: false,
      trail: [],
    })

    nextCharIndex++
  }

  // Lay out caught text using pretext
  function getCaughtLines(): { text: string; width: number }[] {
    if (!caughtText) return []
    const prepared = prepareWithSegments(caughtText, CAUGHT_FONT)
    const result = layoutWithLines(prepared, canvasWidth - 40, CAUGHT_LINE_HEIGHT)
    return result.lines.map((l) => ({ text: l.text, width: l.width }))
  }

  // Render
  let lastTime = performance.now()

  function render(now: number) {
    const rawDt = (now - lastTime) / 1000
    const dt = Math.min(rawDt, 1 / 30)
    lastTime = now
    gameTime += dt

    setupCanvas()

    // Increase speed over time
    speedMultiplier = 1 + gameTime / 60 // +1x every 60 seconds
    baseSpawnRate = Math.max(0.12, 0.6 - gameTime / 200)

    // Spawn
    spawnTimer -= dt
    if (spawnTimer <= 0) {
      spawnChar()
      spawnTimer = baseSpawnRate * (0.7 + Math.random() * 0.6)
    }

    const playAreaBottom = canvasHeight * PLAY_AREA_HEIGHT_RATIO
    const platformY = playAreaBottom - PLATFORM_HEIGHT

    // Update falling chars
    for (let i = fallingChars.length - 1; i >= 0; i--) {
      const ch = fallingChars[i]!
      if (ch.caught) continue

      // Save trail
      ch.trail.push(ch.y)
      if (ch.trail.length > 5) ch.trail.shift()

      ch.y += ch.vy * dt
      ch.x += ch.drift * dt + accelDrift * dt * 0.3

      // Keep on screen horizontally
      if (ch.x < 10) ch.x = 10
      if (ch.x > canvasWidth - 10) ch.x = canvasWidth - 10

      // Check platform collision
      const charBottom = ch.y + 14 // approximate char height
      if (charBottom >= platformY && charBottom <= platformY + PLATFORM_HEIGHT + ch.vy * dt + 10) {
        const platLeft = platformX - PLATFORM_WIDTH / 2
        const platRight = platformX + PLATFORM_WIDTH / 2
        if (ch.x >= platLeft && ch.x <= platRight) {
          // Caught!
          ch.caught = true
          caught++
          caughtText += ch.char
          fallingChars.splice(i, 1)
          continue
        }
      }

      // Fell past bottom of play area
      if (ch.y > playAreaBottom + 30) {
        missed++
        ch.opacity -= 0.05
        if (ch.opacity <= 0) {
          fallingChars.splice(i, 1)
        }
      }
    }

    // --- Draw ---
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight)
    bgGrad.addColorStop(0, '#06060f')
    bgGrad.addColorStop(0.7, '#0a0a1a')
    bgGrad.addColorStop(1, '#0f0f20')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw falling characters
    ctx.font = CHAR_FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    for (const ch of fallingChars) {
      if (ch.caught) continue

      // Trail effect
      for (let t = 0; t < ch.trail.length; t++) {
        const trailAlpha = (t / ch.trail.length) * 0.15 * ch.opacity
        ctx.globalAlpha = trailAlpha
        ctx.fillStyle = '#818cf8'
        ctx.fillText(ch.char, ch.x, ch.trail[t]!)
      }

      // Main character
      // Color: white at slow speed, accent at fast speed
      const speedRatio = Math.min(ch.vy / (baseFallSpeed * 3), 1)
      const r = Math.round(237 - speedRatio * (237 - 129))
      const g = Math.round(237 - speedRatio * (237 - 140))
      const b = Math.round(240 + speedRatio * (248 - 240))

      ctx.globalAlpha = ch.opacity
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillText(ch.char, ch.x, ch.y)
    }
    ctx.globalAlpha = 1

    // Draw platform
    const platLeft = platformX - PLATFORM_WIDTH / 2
    const platGrad = ctx.createLinearGradient(platLeft, platformY, platLeft + PLATFORM_WIDTH, platformY)
    platGrad.addColorStop(0, 'rgba(129, 140, 248, 0.1)')
    platGrad.addColorStop(0.5, 'rgba(129, 140, 248, 0.6)')
    platGrad.addColorStop(1, 'rgba(129, 140, 248, 0.1)')
    ctx.fillStyle = platGrad
    ctx.fillRect(platLeft, platformY, PLATFORM_WIDTH, PLATFORM_HEIGHT)

    // Platform glow
    const glowGrad = ctx.createRadialGradient(platformX, platformY, 0, platformX, platformY, PLATFORM_WIDTH / 2)
    glowGrad.addColorStop(0, 'rgba(129, 140, 248, 0.1)')
    glowGrad.addColorStop(1, 'rgba(129, 140, 248, 0)')
    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.ellipse(platformX, platformY, PLATFORM_WIDTH / 2, 20, 0, 0, Math.PI * 2)
    ctx.fill()

    // Platform end caps
    ctx.fillStyle = 'rgba(129, 140, 248, 0.8)'
    ctx.beginPath()
    ctx.arc(platLeft, platformY + PLATFORM_HEIGHT / 2, PLATFORM_HEIGHT / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(platLeft + PLATFORM_WIDTH, platformY + PLATFORM_HEIGHT / 2, PLATFORM_HEIGHT / 2, 0, Math.PI * 2)
    ctx.fill()

    // Divider line between play area and collection area
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(0, playAreaBottom + 10)
    ctx.lineTo(canvasWidth, playAreaBottom + 10)
    ctx.stroke()
    ctx.setLineDash([])

    // Collection area label
    ctx.font = '11px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(129, 140, 248, 0.4)'
    ctx.fillText('COLLECTED TEXT', 16, playAreaBottom + 16)

    // Draw caught text using pretext layout
    const caughtLines = getCaughtLines()
    ctx.font = CAUGHT_FONT
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const collectionTop = playAreaBottom + 32
    const maxVisibleLines = Math.floor((canvasHeight - collectionTop - 10) / CAUGHT_LINE_HEIGHT)

    // Show last N lines that fit
    const startLine = Math.max(0, caughtLines.length - maxVisibleLines)

    for (let i = startLine; i < caughtLines.length; i++) {
      const line = caughtLines[i]!
      const y = collectionTop + (i - startLine) * CAUGHT_LINE_HEIGHT

      // Fade in newest line
      const lineAge = caughtLines.length - 1 - i
      const alpha = lineAge === 0 ? 0.7 + Math.sin(gameTime * 4) * 0.3 : 0.85

      ctx.globalAlpha = alpha
      ctx.fillStyle = '#ededf0'
      ctx.fillText(line.text, 20, y)
    }
    ctx.globalAlpha = 1

    // Scroll indicator if text overflows
    if (caughtLines.length > maxVisibleLines) {
      ctx.font = '10px Inter'
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(129, 140, 248, 0.5)'
      ctx.fillText(`... ${startLine} more lines above`, canvasWidth - 16, playAreaBottom + 16)
    }

    // Update score display
    scoreEl.textContent = `Caught: ${caught} | Missed: ${missed}`
    const speedText = `Speed: ${speedMultiplier.toFixed(1)}x`
    speedEl.textContent = speedText

    // Completion percentage hint
    if (caughtText.length > 0) {
      const pct = Math.round((caughtText.length / SOURCE_TEXT.length) * 100)
      ctx.font = '11px Inter'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = 'rgba(52, 211, 153, 0.5)'
      ctx.fillText(`${pct}% of passage collected`, canvasWidth - 16, canvasHeight - 8)
    }

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)

  // Source viewer
  await createSourceViewer(document.getElementById('rain-source')!, {
    code: `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

// Measure each unique character's width with pretext
const charWidthMap = new Map<string, number>()
for (const char of new Set(sourceText)) {
  const prepared = prepareWithSegments(char, '18px Inter')
  charWidthMap.set(char, prepared.widths[0] ?? 10)
}

// Each falling character carries its pretext-measured width
interface FallingChar {
  char: string
  x: number; y: number
  vy: number           // fall speed
  width: number        // from pretext measurement
  drift: number        // horizontal wind drift
  index: number        // position in original text
}

// Platform collision detection using char widths
if (char.y > platformY && char.x > platLeft && char.x < platRight) {
  caughtText += char.char
  caught++
}

// Re-layout caught text with pretext for proper wrapping
function getCaughtLines() {
  const prepared = prepareWithSegments(caughtText, '14px Inter')
  const result = layoutWithLines(prepared, maxWidth, 20)
  return result.lines  // each line has .text and .width
}

// Render caught text in collection area
const lines = getCaughtLines()
lines.forEach((line, i) => {
  ctx.fillText(line.text, 20, collectionTop + i * 20)
})

// Speed increases over time for challenge
speedMultiplier = 1 + gameTime / 60`,
    title: 'Text Rain Implementation',
  })
}

init()
