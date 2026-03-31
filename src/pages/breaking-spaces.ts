import { prepare, layout } from '@chenglou/pretext'
import type { PreparedText } from '@chenglou/pretext'
import { waitForFonts, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

// ══════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 500

const FIELD_MIN_WIDTH = 350
const FIELD_MAX_WIDTH = 600
const FIELD_INITIAL_WIDTH = 480

const ALIEN_ROWS = 3
const ALIEN_COLS = 5
const ALIEN_FONT = '13px Inter'
const ALIEN_LINE_HEIGHT = 18
const ALIEN_PADDING = 5
const ALIEN_GAP = 4
const ALIEN_TOP_Y = 45

const PLAYER_TEXT = 'BREAKING SPACES'
const PLAYER_FONT = '14px Inter'
const PLAYER_LINE_HEIGHT = 20
const PLAYER_PADDING = 8
const PLAYER_BOTTOM_MARGIN = 30

const BULLET_SPEED = 380
const ALIEN_BULLET_SPEED = 160
const PLAYER_FIRE_COOLDOWN = 0.28
const MAX_ALIEN_BULLETS = 2
const ALIEN_FIRE_BASE_INTERVAL = 3.5

const ALIEN_BASE_SPEED = 14
const ALIEN_DROP_AMOUNT = 12

const OSCILLATE_PERIOD = 10

const ROW_HUES = [0, 120, 220]
const ROW_POINTS = [100, 50, 25]

const ALIEN_TEXTS = [
  'breaking through space',
  'reflow reshapes reality',
  'width is everything',
  'instant measurement now',
  'text wraps beautifully',
  'no DOM reflow here',
  'predict every height',
  'cached glyph widths',
  'multiline text mastery',
  'arithmetic layout speed',
  'the shape of text',
  'words flow like water',
  'resize the universe',
  'dimensional shift now',
  'pure calculation power',
  'faster than the DOM',
  'beyond browser limits',
  'pixel perfect text',
  'prepare once forever',
  'space defender protocol',
  'invading your width',
  'constraint invasion force',
  'breaking all barriers',
  'typographic assault now',
  'glyph storm incoming',
  'text block squadron',
  'reflow attack wave',
  'width wave strike force',
  'layout at light speed',
  'character by character',
  'wrapping around worlds',
  'line break insurgent',
  'paragraph formation up',
  'justify the invasion',
  'kern and conquer all',
  'tracking the targets',
  'leading the assault now',
  'measure then destroy',
  'baseline raiders here',
  'ascender descender drop',
]

// ══════════════════════════════════════════════════════════════
// Interfaces
// ══════════════════════════════════════════════════════════════

interface Alien {
  row: number
  col: number
  text: string
  prepared: PreparedText
  x: number
  y: number
  width: number
  height: number
  targetX: number
  targetY: number
  targetWidth: number
  targetHeight: number
  lineCount: number
  hue: number
  alive: boolean
  hitFlash: number
}

interface Bullet {
  x: number
  y: number
  vy: number
  isPlayer: boolean
}

interface Particle {
  char: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
}

interface ScorePopup {
  text: string
  x: number
  y: number
  life: number
}

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinklePhase: number
}

// ══════════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════════

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Breaking Spaces</h1>
      <p class="content__subtitle">Space invaders meets text reflow. The battlefield <em>reshapes in real-time</em> as the width oscillates — every invader, the ship itself, all recalculated by <span class="api-tag">layout()</span> every single frame.</p>
    </div>

    <div class="content__section">
      <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;align-items:flex-start;">
        <div style="flex:0 0 auto;">
          <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-3);flex-wrap:wrap;align-items:center;">
            <button id="bs-start" class="btn btn--primary">Start</button>
            <button id="bs-reset" class="btn btn--secondary">Reset</button>
            <div id="bs-score" style="font-size:var(--text-sm);color:var(--color-text-secondary);font-family:var(--font-code);">Score: 0</div>
            <div id="bs-lives" style="font-size:var(--text-sm);color:var(--color-error);font-family:var(--font-code);">&#9829;&#9829;&#9829;</div>
            <div id="bs-wave" style="font-size:var(--text-sm);color:var(--color-accent);font-family:var(--font-code);">Wave 1</div>
          </div>
          <div class="demo-area" style="width:${CANVAS_WIDTH}px;height:${CANVAS_HEIGHT}px;position:relative;overflow:hidden;touch-action:none;outline:none;padding:0;" id="bs-field" tabindex="0">
            <canvas id="bs-canvas" style="width:100%;height:100%;display:block;"></canvas>
          </div>
          <div style="margin-top:var(--space-3);display:flex;gap:var(--space-3);align-items:center;max-width:${CANVAS_WIDTH}px;">
            <label style="font-size:var(--text-xs);color:var(--color-text-tertiary);white-space:nowrap;">Width:</label>
            <input type="range" id="bs-width-slider" min="${FIELD_MIN_WIDTH}" max="${FIELD_MAX_WIDTH}" value="${FIELD_INITIAL_WIDTH}" style="flex:1;" />
            <span id="bs-width-label" style="font-size:var(--text-xs);font-family:var(--font-code);color:var(--color-text-secondary);min-width:42px;">${FIELD_INITIAL_WIDTH}px</span>
            <label style="font-size:var(--text-xs);color:var(--color-text-tertiary);display:flex;align-items:center;gap:var(--space-1);cursor:pointer;white-space:nowrap;">
              <input type="checkbox" id="bs-oscillate" checked /> Auto
            </label>
          </div>
          <p style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-text-tertiary);">\u2190 \u2192 move &middot; Space fire &middot; Width reshapes everything</p>
        </div>
        <div style="flex:1 1 200px;min-width:200px;">
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-3);">
            <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">REFLOW STATS</div>
            <div id="bs-stats" style="font-size:var(--text-sm);font-family:var(--font-code);color:var(--color-text-secondary);line-height:1.8;"></div>
          </div>
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-3);">
            <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">PRETEXT LIVE</div>
            <div id="bs-pretext-info" style="font-size:var(--text-xs);font-family:var(--font-code);color:var(--color-accent);line-height:1.8;"></div>
          </div>
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);">
            <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">HOW IT WORKS</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary);line-height:1.6;">
              The field width oscillates via sine wave. Each frame, <span style="color:var(--color-accent);">layout()</span> is called for <em>every alien + the player</em> to recompute dimensions. Collision detection uses reflowed heights. When the field narrows, aliens grow <em>taller</em> and press downward. <strong>Pretext makes this trivial at 60fps.</strong>
            </div>
          </div>
        </div>
      </div>
      <div id="bs-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  // ════════════════════════════════════════
  // Canvas Setup
  // ════════════════════════════════════════

  const field = document.getElementById('bs-field')!
  const canvas = document.getElementById('bs-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const startBtn = document.getElementById('bs-start')!
  const resetBtn = document.getElementById('bs-reset')!
  const scoreEl = document.getElementById('bs-score')!
  const livesEl = document.getElementById('bs-lives')!
  const waveEl = document.getElementById('bs-wave')!
  const widthSlider = document.getElementById('bs-width-slider') as HTMLInputElement
  const widthLabel = document.getElementById('bs-width-label')!
  const oscillateCheckbox = document.getElementById('bs-oscillate') as HTMLInputElement
  const statsEl = document.getElementById('bs-stats')!
  const pretextInfoEl = document.getElementById('bs-pretext-info')!

  const dpr = window.devicePixelRatio || 1
  canvas.width = CANVAS_WIDTH * dpr
  canvas.height = CANVAS_HEIGHT * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // ════ Stars ════
  const stars: Star[] = Array.from({ length: 80 }, () => ({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    size: Math.random() * 1.5 + 0.5,
    brightness: Math.random() * 0.4 + 0.1,
    twinkleSpeed: Math.random() * 2 + 0.5,
    twinklePhase: Math.random() * Math.PI * 2,
  }))

  // ════ Prepare player ════
  const playerPrepared = prepare(PLAYER_TEXT, PLAYER_FONT)
  const titlePrepared = prepare('BREAKING SPACES', '28px Inter')

  // ════════════════════════════════════════
  // Game State
  // ════════════════════════════════════════

  let fieldWidth = FIELD_INITIAL_WIDTH
  let oscillating = true
  let oscillatePhase = 0

  let running = false
  let gameOver = false
  let score = 0
  let lives = 3
  let wave = 1

  let aliens: Alien[] = []
  let bullets: Bullet[] = []
  let particles: Particle[] = []
  let scorePopups: ScorePopup[] = []

  let playerX = CANVAS_WIDTH / 2
  let playerWidth = 0
  let playerHeight = 0
  let playerFireCooldown = 0

  let alienOffsetX = 0
  let alienMoveDir = 1
  let alienDropOffset = 0
  let alienSpeed = ALIEN_BASE_SPEED
  let alienFireTimer = 0

  let frameLayoutCalls = 0
  let totalLayoutCalls = 0
  let totalLayoutTime = 0
  let layoutCallsInWindow = 0
  let layoutWindowStart = performance.now()
  let layoutCallsPerSecond = 0

  let shakeAmount = 0

  // ════════════════════════════════════════
  // Wave Management
  // ════════════════════════════════════════

  function spawnWave() {
    aliens = []
    alienOffsetX = 0
    alienMoveDir = 1
    alienDropOffset = 0
    alienSpeed = ALIEN_BASE_SPEED + wave * 3
    alienFireTimer = 0

    const startIndex = ((wave - 1) * ALIEN_ROWS * ALIEN_COLS) % ALIEN_TEXTS.length

    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        const textIndex = (startIndex + r * ALIEN_COLS + c) % ALIEN_TEXTS.length
        const text = ALIEN_TEXTS[textIndex]!
        const prepared = prepare(text, ALIEN_FONT)
        const hue = ROW_HUES[r]!

        aliens.push({
          row: r,
          col: c,
          text,
          prepared,
          x: 0, y: -50 - r * 30,
          width: 0, height: 0,
          targetX: 0, targetY: 0,
          targetWidth: 0, targetHeight: 0,
          lineCount: 1,
          hue,
          alive: true,
          hitFlash: 0,
        })
      }
    }

    // Compute initial grid positions
    computeAlienGrid()
    for (const alien of aliens) {
      alien.x = alien.targetX
      alien.width = alien.targetWidth
      alien.height = alien.targetHeight
      // Keep y at staggered entry positions for fly-in effect
    }
  }

  // ════════════════════════════════════════
  // Layout Computation
  // ════════════════════════════════════════

  function computeAlienGrid() {
    const fieldLeft = (CANVAS_WIDTH - fieldWidth) / 2
    const colWidth = (fieldWidth - (ALIEN_COLS + 1) * ALIEN_GAP) / ALIEN_COLS
    const innerWidth = Math.max(10, colWidth - ALIEN_PADDING * 2)

    for (const alien of aliens) {
      if (!alien.alive) continue
      const start = performance.now()
      const result = layout(alien.prepared, innerWidth, ALIEN_LINE_HEIGHT)
      totalLayoutTime += performance.now() - start
      frameLayoutCalls++
      totalLayoutCalls++

      alien.targetWidth = colWidth
      alien.targetHeight = result.height + ALIEN_PADDING * 2
      alien.lineCount = result.lineCount
    }

    // Max height per row
    const rowHeights: number[] = new Array(ALIEN_ROWS).fill(0)
    for (const alien of aliens) {
      if (!alien.alive) continue
      rowHeights[alien.row] = Math.max(rowHeights[alien.row]!, alien.targetHeight)
    }

    // Row Y positions
    let y = ALIEN_TOP_Y + alienDropOffset
    const rowYs: number[] = []
    for (let r = 0; r < ALIEN_ROWS; r++) {
      rowYs.push(y)
      y += (rowHeights[r] || 0) + ALIEN_GAP
    }

    // Target positions
    for (const alien of aliens) {
      if (!alien.alive) continue
      alien.targetX = fieldLeft + ALIEN_GAP + alien.col * (colWidth + ALIEN_GAP) + alienOffsetX
      alien.targetY = rowYs[alien.row]!
    }
  }

  function computePlayerLayout() {
    const playerMaxWidth = Math.min(160, fieldWidth * 0.28)
    const innerWidth = Math.max(10, playerMaxWidth - PLAYER_PADDING * 2)

    const start = performance.now()
    const result = layout(playerPrepared, innerWidth, PLAYER_LINE_HEIGHT)
    totalLayoutTime += performance.now() - start
    frameLayoutCalls++
    totalLayoutCalls++

    playerWidth = playerMaxWidth
    playerHeight = result.height + PLAYER_PADDING * 2
  }

  // ════════════════════════════════════════
  // Game Logic
  // ════════════════════════════════════════

  function rectsOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  function firePlayerBullet() {
    if (playerFireCooldown > 0) return
    playerFireCooldown = PLAYER_FIRE_COOLDOWN

    const playerTop = CANVAS_HEIGHT - PLAYER_BOTTOM_MARGIN - playerHeight
    bullets.push({
      x: playerX,
      y: playerTop - 2,
      vy: -BULLET_SPEED,
      isPlayer: true,
    })
  }

  function destroyAlien(alien: Alien, bx: number, by: number) {
    alien.alive = false

    const points = ROW_POINTS[alien.row]!
    score += points
    scorePopups.push({ text: `+${points}`, x: bx, y: by, life: 1 })

    // Character particles
    for (const char of alien.text) {
      if (char === ' ') continue
      particles.push({
        char,
        x: alien.x + Math.random() * alien.width,
        y: alien.y + Math.random() * alien.height,
        vx: (Math.random() - 0.5) * 250,
        vy: (Math.random() - 0.5) * 250 - 80,
        life: 1,
        maxLife: 1,
        hue: alien.hue,
      })
    }

    shakeAmount = 4
    scoreEl.textContent = `Score: ${score}`

    // All aliens dead? Next wave
    if (aliens.every(a => !a.alive)) {
      score += 200 * wave
      scoreEl.textContent = `Score: ${score}`
      wave++
      waveEl.textContent = `Wave ${wave}`
      spawnWave()
    }
  }

  function hitPlayer() {
    lives--
    livesEl.textContent = '\u2665'.repeat(lives) + '\u2661'.repeat(3 - lives)
    shakeAmount = 8

    // Spawn player particles
    for (let i = 0; i < 8; i++) {
      particles.push({
        char: '\u2665',
        x: playerX + (Math.random() - 0.5) * playerWidth,
        y: CANVAS_HEIGHT - PLAYER_BOTTOM_MARGIN - playerHeight / 2,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 200 - 50,
        life: 0.8,
        maxLife: 0.8,
        hue: 350,
      })
    }

    if (lives <= 0) {
      gameOver = true
      running = false
      startBtn.textContent = 'Game Over'
      startBtn.style.opacity = '0.5'
    }
  }

  // ════════════════════════════════════════
  // Input
  // ════════════════════════════════════════

  const keysDown = new Set<string>()

  field.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
    }
    if (!running || gameOver) return
    keysDown.add(e.key)
    if (e.key === ' ') firePlayerBullet()
  })

  field.addEventListener('keyup', (e) => {
    keysDown.delete(e.key)
  })

  // Touch controls
  let touchStartX = 0
  let touchMoved = false

  field.addEventListener('touchstart', (e) => {
    e.preventDefault()
    if (!running || gameOver) return
    touchStartX = e.touches[0]!.clientX
    touchMoved = false
  })

  field.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (!running || gameOver) return
    const touch = e.touches[0]!
    const dx = touch.clientX - touchStartX
    if (Math.abs(dx) > 10) {
      touchMoved = true
      const rect = field.getBoundingClientRect()
      const scale = CANVAS_WIDTH / rect.width
      const canvasX = (touch.clientX - rect.left) * scale
      const fieldLeft = (CANVAS_WIDTH - fieldWidth) / 2
      playerX = Math.max(fieldLeft + playerWidth / 2, Math.min(fieldLeft + fieldWidth - playerWidth / 2, canvasX))
    }
  })

  field.addEventListener('touchend', (e) => {
    e.preventDefault()
    if (!touchMoved) firePlayerBullet()
  })

  // Slider / oscillation
  widthSlider.addEventListener('input', () => {
    if (!oscillating) {
      fieldWidth = parseInt(widthSlider.value)
      widthLabel.textContent = `${fieldWidth}px`
    }
  })

  oscillateCheckbox.addEventListener('change', () => {
    oscillating = oscillateCheckbox.checked
    if (!oscillating) widthSlider.value = String(fieldWidth)
  })

  // Start / Reset
  function resetGame() {
    running = false
    gameOver = false
    score = 0
    lives = 3
    wave = 1
    aliens = []
    bullets = []
    particles = []
    scorePopups = []
    playerX = CANVAS_WIDTH / 2
    playerFireCooldown = 0
    alienOffsetX = 0
    alienMoveDir = 1
    alienDropOffset = 0
    alienSpeed = ALIEN_BASE_SPEED
    alienFireTimer = 0
    frameLayoutCalls = 0
    totalLayoutCalls = 0
    totalLayoutTime = 0
    layoutCallsInWindow = 0
    layoutWindowStart = performance.now()
    layoutCallsPerSecond = 0
    shakeAmount = 0
    oscillatePhase = 0
    fieldWidth = FIELD_INITIAL_WIDTH

    scoreEl.textContent = 'Score: 0'
    livesEl.textContent = '\u2665\u2665\u2665'
    waveEl.textContent = 'Wave 1'
    startBtn.textContent = 'Start'
    startBtn.style.opacity = '1'
    statsEl.textContent = ''
    pretextInfoEl.textContent = ''
    widthSlider.value = String(FIELD_INITIAL_WIDTH)
    widthLabel.textContent = `${FIELD_INITIAL_WIDTH}px`
  }

  startBtn.addEventListener('click', () => {
    if (gameOver) { resetGame(); return }
    if (!running) {
      running = true
      startBtn.textContent = 'Pause'
      field.focus()
      if (aliens.length === 0) spawnWave()
    } else {
      running = false
      startBtn.textContent = 'Resume'
    }
  })

  resetBtn.addEventListener('click', resetGame)

  // ════════════════════════════════════════
  // Drawing Helpers
  // ════════════════════════════════════════

  function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    r = Math.min(r, w / 2, h / 2)
    if (r < 0) r = 0
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function canvasWrapText(text: string, maxWidth: number, font: string): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    ctx.font = font
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  }

  function drawTextBlock(
    text: string, x: number, y: number, w: number, h: number,
    hue: number, alpha: number, font: string, lineHeight: number,
    padding: number, active: boolean, flash: number,
  ) {
    if (w <= 0 || h <= 0) return

    // Background
    drawRoundedRect(x, y, w, h, 5)
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.6 * alpha})`
    } else {
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${0.15 * alpha})`
    }
    ctx.fill()

    // Border
    ctx.strokeStyle = flash > 0
      ? `rgba(255, 255, 255, ${flash * alpha})`
      : `hsla(${hue}, 70%, 50%, ${(active ? 0.8 : 0.4) * alpha})`
    ctx.lineWidth = active ? 2 : 1
    ctx.stroke()

    // Active glow
    if (active) {
      ctx.shadowColor = `hsla(${hue}, 70%, 50%, 0.4)`
      ctx.shadowBlur = 10
      drawRoundedRect(x, y, w, h, 5)
      ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.2)`
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Text
    ctx.font = font
    ctx.fillStyle = flash > 0
      ? `rgba(255, 255, 255, ${alpha})`
      : `hsla(${hue}, 70%, 80%, ${0.9 * alpha})`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const innerWidth = Math.max(1, w - padding * 2)
    const lines = canvasWrapText(text, innerWidth, font)
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, x + padding, y + padding + i * lineHeight, innerWidth)
    }
  }

  // ════════════════════════════════════════
  // Render Loop
  // ════════════════════════════════════════

  let lastTime = performance.now()

  function render(now: number) {
    const rawDt = (now - lastTime) / 1000
    const dt = Math.min(rawDt, 1 / 30)
    lastTime = now
    frameLayoutCalls = 0

    // ── Field width oscillation (always, even when paused) ──
    if (oscillating) {
      oscillatePhase += dt * (2 * Math.PI / OSCILLATE_PERIOD)
      const mid = (FIELD_MIN_WIDTH + FIELD_MAX_WIDTH) / 2
      const amp = (FIELD_MAX_WIDTH - FIELD_MIN_WIDTH) / 2
      fieldWidth = Math.round(mid + Math.sin(oscillatePhase) * amp)
      widthSlider.value = String(fieldWidth)
      widthLabel.textContent = `${fieldWidth}px`
    }

    const fieldLeft = (CANVAS_WIDTH - fieldWidth) / 2
    const fieldRight = fieldLeft + fieldWidth

    // ══════════════════════════════════════
    // UPDATE
    // ══════════════════════════════════════

    if (running && !gameOver) {
      // Player movement
      const PLAYER_SPEED = 300
      if (keysDown.has('ArrowLeft')) playerX -= PLAYER_SPEED * dt
      if (keysDown.has('ArrowRight')) playerX += PLAYER_SPEED * dt

      // Compute layouts
      computeAlienGrid()
      computePlayerLayout()

      // Clamp player to field
      playerX = Math.max(fieldLeft + playerWidth / 2, Math.min(fieldRight - playerWidth / 2, playerX))
      playerFireCooldown = Math.max(0, playerFireCooldown - dt)

      // Lerp alien positions
      const lerpRate = 1 - Math.pow(0.0001, dt)
      for (const alien of aliens) {
        if (!alien.alive) continue
        alien.x += (alien.targetX - alien.x) * lerpRate
        alien.y += (alien.targetY - alien.y) * lerpRate
        alien.width += (alien.targetWidth - alien.width) * lerpRate
        alien.height += (alien.targetHeight - alien.height) * lerpRate

        if (Math.abs(alien.x - alien.targetX) < 0.5) alien.x = alien.targetX
        if (Math.abs(alien.y - alien.targetY) < 0.5) alien.y = alien.targetY
        if (Math.abs(alien.width - alien.targetWidth) < 0.5) alien.width = alien.targetWidth
        if (Math.abs(alien.height - alien.targetHeight) < 0.5) alien.height = alien.targetHeight

        if (alien.hitFlash > 0) alien.hitFlash = Math.max(0, alien.hitFlash - dt)
      }

      // Move alien formation
      alienOffsetX += alienMoveDir * alienSpeed * dt

      // Check bounds — clamp and reverse if out
      let minX = Infinity
      let maxRight = -Infinity
      for (const alien of aliens) {
        if (!alien.alive) continue
        minX = Math.min(minX, alien.targetX)
        maxRight = Math.max(maxRight, alien.targetX + alien.targetWidth)
      }

      if (minX !== Infinity) {
        let reversed = false
        if (minX < fieldLeft) {
          alienOffsetX += fieldLeft - minX
          for (const a of aliens) { if (a.alive) { a.targetX += fieldLeft - minX; a.x += fieldLeft - minX } }
          if (alienMoveDir === -1) reversed = true
          alienMoveDir = 1
        }
        if (maxRight > fieldRight) {
          const correction = maxRight - fieldRight
          alienOffsetX -= correction
          for (const a of aliens) { if (a.alive) { a.targetX -= correction; a.x -= correction } }
          if (alienMoveDir === 1) reversed = true
          alienMoveDir = -1
        }
        if (reversed) {
          alienDropOffset += ALIEN_DROP_AMOUNT
          alienSpeed += 1
        }
      }

      // Alien firing
      alienFireTimer += dt
      const fireInterval = Math.max(0.5, ALIEN_FIRE_BASE_INTERVAL - wave * 0.3)
      if (alienFireTimer >= fireInterval) {
        alienFireTimer = 0
        const alienBulletCount = bullets.filter(b => !b.isPlayer).length
        if (alienBulletCount < MAX_ALIEN_BULLETS) {
          const aliveAliens = aliens.filter(a => a.alive)
          if (aliveAliens.length > 0) {
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)]!
            bullets.push({
              x: shooter.x + shooter.width / 2,
              y: shooter.y + shooter.height,
              vy: ALIEN_BULLET_SPEED + wave * 10,
              isPlayer: false,
            })
          }
        }
      }

      // Move bullets
      for (const bullet of bullets) {
        bullet.y += bullet.vy * dt
      }
      bullets = bullets.filter(b => b.y > -20 && b.y < CANVAS_HEIGHT + 20)

      // ── Collisions ──
      const playerLeft = playerX - playerWidth / 2
      const playerTop = CANVAS_HEIGHT - PLAYER_BOTTOM_MARGIN - playerHeight

      // Player bullets vs aliens
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const bullet = bullets[bi]!
        if (!bullet.isPlayer) continue

        for (const alien of aliens) {
          if (!alien.alive) continue
          if (rectsOverlap(
            bullet.x - 2, bullet.y - 6, 4, 12,
            alien.x, alien.y, alien.width, alien.height,
          )) {
            destroyAlien(alien, bullet.x, bullet.y)
            bullets.splice(bi, 1)
            break
          }
        }
      }

      // Alien bullets vs player
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const bullet = bullets[bi]!
        if (bullet.isPlayer) continue

        if (rectsOverlap(
          bullet.x - 2, bullet.y - 4, 4, 8,
          playerLeft, playerTop, playerWidth, playerHeight,
        )) {
          hitPlayer()
          bullets.splice(bi, 1)
        }
      }

      // Aliens reached player level → game over
      for (const alien of aliens) {
        if (!alien.alive) continue
        if (alien.y + alien.height > playerTop) {
          gameOver = true
          running = false
          startBtn.textContent = 'Game Over'
          startBtn.style.opacity = '0.5'
          break
        }
      }
    }

    // Update particles
    for (const p of particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 200 * dt
      p.life -= dt * 1.5
    }
    particles = particles.filter(p => p.life > 0)

    // Update score popups
    for (const popup of scorePopups) {
      popup.y -= 40 * dt
      popup.life -= dt * 1.5
    }
    scorePopups = scorePopups.filter(p => p.life > 0)

    // Shake decay
    if (shakeAmount > 0) {
      shakeAmount *= Math.pow(0.01, dt)
      if (shakeAmount < 0.3) shakeAmount = 0
    }

    // Layout calls per second
    layoutCallsInWindow += frameLayoutCalls
    if (now - layoutWindowStart >= 1000) {
      layoutCallsPerSecond = layoutCallsInWindow
      layoutCallsInWindow = 0
      layoutWindowStart = now
    }

    // ══════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════

    ctx.save()

    if (shakeAmount > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shakeAmount * 2,
        (Math.random() - 0.5) * shakeAmount * 2,
      )
    }

    // Background
    ctx.fillStyle = '#060610'
    ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20)

    // Stars
    for (const star of stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(now / 1000 * star.twinkleSpeed + star.twinklePhase)
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`
      ctx.fillRect(star.x, star.y, star.size, star.size)
    }

    // Field walls
    if (fieldLeft > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, fieldLeft, CANVAS_HEIGHT)

      const edgeGrad = ctx.createLinearGradient(fieldLeft - 20, 0, fieldLeft, 0)
      edgeGrad.addColorStop(0, 'rgba(129, 140, 248, 0)')
      edgeGrad.addColorStop(1, 'rgba(129, 140, 248, 0.12)')
      ctx.fillStyle = edgeGrad
      ctx.fillRect(fieldLeft - 20, 0, 20, CANVAS_HEIGHT)

      ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(fieldLeft, 0)
      ctx.lineTo(fieldLeft, CANVAS_HEIGHT)
      ctx.stroke()
    }
    if (fieldRight < CANVAS_WIDTH) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(fieldRight, 0, CANVAS_WIDTH - fieldRight, CANVAS_HEIGHT)

      const edgeGrad = ctx.createLinearGradient(fieldRight, 0, fieldRight + 20, 0)
      edgeGrad.addColorStop(0, 'rgba(129, 140, 248, 0.12)')
      edgeGrad.addColorStop(1, 'rgba(129, 140, 248, 0)')
      ctx.fillStyle = edgeGrad
      ctx.fillRect(fieldRight, 0, 20, CANVAS_HEIGHT)

      ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(fieldRight, 0)
      ctx.lineTo(fieldRight, CANVAS_HEIGHT)
      ctx.stroke()
    }

    // Width indicator bar
    const barY = 4
    const barH = 3
    const barFull = CANVAS_WIDTH - 40
    const barW = ((fieldWidth - FIELD_MIN_WIDTH) / (FIELD_MAX_WIDTH - FIELD_MIN_WIDTH)) * barFull
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fillRect(20, barY, barFull, barH)
    ctx.fillStyle = 'rgba(129, 140, 248, 0.35)'
    ctx.fillRect(20 + (barFull - barW) / 2, barY, barW, barH)

    // Aliens
    for (const alien of aliens) {
      if (!alien.alive) continue
      drawTextBlock(
        alien.text, alien.x, alien.y, alien.width, alien.height,
        alien.hue, 0.85, ALIEN_FONT, ALIEN_LINE_HEIGHT,
        ALIEN_PADDING, false, alien.hitFlash / 0.15,
      )
    }

    // Player
    if (!gameOver) {
      computePlayerLayout()
      const playerLeft = playerX - playerWidth / 2
      const playerTop = CANVAS_HEIGHT - PLAYER_BOTTOM_MARGIN - playerHeight
      drawTextBlock(
        PLAYER_TEXT, playerLeft, playerTop, playerWidth, playerHeight,
        240, 1, PLAYER_FONT, PLAYER_LINE_HEIGHT,
        PLAYER_PADDING, true, 0,
      )
    }

    // Bullets
    for (const bullet of bullets) {
      if (bullet.isPlayer) {
        ctx.fillStyle = 'rgba(129, 140, 248, 0.9)'
        ctx.shadowColor = 'rgba(129, 140, 248, 0.6)'
        ctx.shadowBlur = 8
        ctx.fillRect(bullet.x - 2, bullet.y - 6, 4, 12)
        ctx.shadowBlur = 0
      } else {
        ctx.fillStyle = 'rgba(251, 113, 133, 0.9)'
        ctx.shadowColor = 'rgba(251, 113, 133, 0.6)'
        ctx.shadowBlur = 6
        ctx.fillRect(bullet.x - 2, bullet.y - 4, 4, 8)
        ctx.shadowBlur = 0
      }
    }

    // Particles
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.font = '12px Inter'
      ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${alpha})`
      ctx.fillText(p.char, p.x, p.y)
    }

    // Score popups
    for (const popup of scorePopups) {
      const alpha = Math.max(0, popup.life)
      ctx.font = '600 13px Inter'
      ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(popup.text, popup.x, popup.y)
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '600 28px Inter'
      ctx.fillStyle = '#fb7185'
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 24)
      ctx.font = '16px Inter'
      ctx.fillStyle = '#ededf0'
      ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 12)
      ctx.font = '12px Inter'
      ctx.fillStyle = 'rgba(237, 237, 240, 0.5)'
      ctx.fillText('Click "Reset" to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 42)
    }

    // Idle state — large reflowing title
    if (!running && !gameOver && aliens.length === 0) {
      const titleInner = Math.max(10, fieldWidth - 60)
      const start = performance.now()
      const titleResult = layout(titlePrepared, titleInner, 38)
      totalLayoutTime += performance.now() - start
      frameLayoutCalls++
      totalLayoutCalls++

      const titleH = titleResult.height + 20
      const titleX = (CANVAS_WIDTH - fieldWidth) / 2 + 30
      const titleY = CANVAS_HEIGHT / 2 - titleH / 2 - 20

      ctx.font = '600 28px Inter'
      ctx.fillStyle = 'rgba(129, 140, 248, 0.35)'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const titleLines = canvasWrapText('BREAKING SPACES', titleInner, '600 28px Inter')
      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i]!, titleX, titleY + i * 38, titleInner)
      }

      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.font = '14px Inter'
      ctx.fillStyle = 'rgba(237, 237, 240, 0.25)'
      ctx.fillText('Press "Start" to play', CANVAS_WIDTH / 2, titleY + titleH + 20)
      ctx.font = '11px Inter'
      ctx.fillStyle = 'rgba(237, 237, 240, 0.15)'
      ctx.fillText('Watch the text reflow as the walls move', CANVAS_WIDTH / 2, titleY + titleH + 42)
    }

    ctx.restore()

    // ── Update stat panels ──
    const aliveCount = aliens.filter(a => a.alive).length
    statsEl.innerHTML = [
      `Aliens: ${aliveCount}`,
      `Bullets: ${bullets.length}`,
      `Particles: ${particles.length}`,
      `Field: ${fieldWidth}px`,
      `Wave: ${wave}`,
    ].join('<br>')

    const avgLayoutTime = totalLayoutCalls > 0 ? totalLayoutTime / totalLayoutCalls : 0
    pretextInfoEl.innerHTML = [
      `layout()/frame: ${frameLayoutCalls}`,
      `layout()/sec: ~${layoutCallsPerSecond}`,
      `total calls: ${totalLayoutCalls}`,
      `<span style="color:var(--color-success);">avg: ${avgLayoutTime.toFixed(3)}ms</span>`,
    ].join('<br>')

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
  field.focus()

  // ════════════════════════════════════════
  // Source Viewer
  // ════════════════════════════════════════

  await createSourceViewer(document.getElementById('bs-source')!, {
    code: `import { prepare, layout } from '@chenglou/pretext'

// Prepare all alien texts once at init
const aliens = texts.map(text => ({
  text,
  prepared: prepare(text, '13px Inter'),
}))

// Player ship is also a prepared text block
const player = prepare('BREAKING SPACES', '14px Inter')

// Field width oscillates via sine wave — the core mechanic
const mid = (MIN_WIDTH + MAX_WIDTH) / 2
const amp = (MAX_WIDTH - MIN_WIDTH) / 2
fieldWidth = mid + Math.sin(phase) * amp

// EVERY FRAME: layout() recalculates all dimensions
// 15 aliens + 1 player = 16 layout() calls per frame at 60fps
function reflowEverything(fieldWidth) {
  const colWidth = (fieldWidth - gaps) / COLS
  const innerWidth = colWidth - PADDING * 2

  for (const alien of aliens) {
    // Instant height prediction at new width constraint
    const { height, lineCount } = layout(
      alien.prepared, innerWidth, 18
    )
    // At 600px: wide, short blocks (1-2 lines)
    // At 350px: narrow, tall blocks (3-4 lines)
    // The formation literally BREATHES with the width!
    alien.height = height + PADDING * 2
  }

  // Player ship reflows too — hitbox shape changes!
  const shipWidth = Math.min(160, fieldWidth * 0.28)
  const { height } = layout(player, shipWidth - 16, 20)
  // Wide field → flat ship. Narrow → tall ship.
}

// Collision detection uses pretext-predicted dimensions
// No DOM. No getBoundingClientRect(). Pure arithmetic. 60fps.`,
    title: 'Breaking Spaces: Mass Reflow at 60fps',
  })
}

init()
