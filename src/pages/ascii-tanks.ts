import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const GAME_FONT = '14px JetBrains Mono'
const UI_FONT = '13px Inter'
const TITLE_FONT = 'bold 16px Inter'
const SMALL_FONT = '11px Inter'

const BLOCK_CHARS = { solid: '\u2588', surface: '\u2591', air: '\u00B7', empty: ' ' }
const TANK_ART_L = [' /\u203E\\ ', '|\u2588\u2588|', '\u255A\u2550\u2550\u255D']
const TANK_ART_R = [' /\u203E\\ ', '|\u2588\u2588|', '\u255A\u2550\u2550\u255D']

type GameState = 'AIMING' | 'FIRING' | 'IMPACT' | 'NEXT_TURN' | 'GAME_OVER'

interface Tank {
  col: number
  hp: number
  maxHp: number
  angle: number
  power: number
  color: string
  name: string
}

interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  trail: { x: number; y: number }[]
}

interface Debris {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  life: number
  color: string
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">ASCII Tanks</h1>
      <p class="content__subtitle">A 2-player artillery game rendered entirely in proportional ASCII. Terrain, tanks, and explosions all measured with <span class="api-tag">prepareWithSegments()</span>.</p>
    </div>

    <div class="content__section">
      <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;align-items:center;">
        <button id="fire-btn" class="btn btn--primary">Fire!</button>
        <button id="new-game-btn" class="btn btn--secondary">New Game</button>
        <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary);cursor:pointer;">
          <input type="checkbox" id="ai-toggle" style="accent-color:var(--color-accent);width:16px;height:16px;" />
          AI Player 2
        </label>
        <div id="turn-info" style="margin-left:auto;font-size:var(--text-sm);font-weight:var(--font-weight-semibold);color:var(--color-accent);"></div>
      </div>
      <div class="demo-area demo-area--full" style="height:520px;position:relative;overflow:hidden;cursor:crosshair;touch-action:none;" id="tanks-wrapper">
        <canvas id="tanks-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div style="margin-top:var(--space-2);display:flex;gap:var(--space-4);font-size:var(--text-sm);color:var(--color-text-tertiary);">
        <span>Arrow keys or click/drag to aim</span>
        <span>Up/Down to adjust power</span>
        <span>Space or button to fire</span>
      </div>
      <div id="tanks-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const wrapper = document.getElementById('tanks-wrapper')!
  const canvas = document.getElementById('tanks-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const fireBtn = document.getElementById('fire-btn')!
  const newGameBtn = document.getElementById('new-game-btn')!
  const aiToggle = document.getElementById('ai-toggle') as HTMLInputElement
  const turnInfo = document.getElementById('turn-info')!

  let canvasWidth = 0
  let canvasHeight = 0
  let cols = 0
  let rows = 0

  // Measure block character widths using pretext
  const charWidths: Map<string, number> = new Map()
  for (const [, char] of Object.entries(BLOCK_CHARS)) {
    const prepared = prepareWithSegments(char, GAME_FONT)
    charWidths.set(char, prepared.widths[0] ?? 8)
  }
  // Measure additional chars
  for (const ch of ['*', '\u25CF', '-', '/', '\\', '|', '(', ')', '=', '\u203E', '\u255A', '\u2550', '\u255D']) {
    const prepared = prepareWithSegments(ch, GAME_FONT)
    charWidths.set(ch, prepared.widths[0] ?? 8)
  }

  const cellWidth = charWidths.get(BLOCK_CHARS.solid) ?? 8
  const cellHeight = 16

  function setupCanvas() {
    const rect = wrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    canvasWidth = rect.width
    canvasHeight = rect.height
    cols = Math.floor(canvasWidth / cellWidth)
    rows = Math.floor(canvasHeight / cellHeight)
  }

  setupCanvas()

  // Terrain
  let terrain: number[] = []
  const TERRAIN_BASE = 0.4 // terrain starts at 40% from bottom
  const GRAVITY = 300
  const WIND_MAX = 80

  let wind = 0
  let currentPlayer = 0
  let state: GameState = 'AIMING'
  let tanks: Tank[] = []
  let projectile: Projectile | null = null
  let debris: Debris[] = []
  let scores = [0, 0]
  let aiEnabled = false
  let aimDragStart: { x: number; y: number } | null = null

  function generateTerrain() {
    terrain = new Array(cols)
    const baseHeight = Math.floor(rows * TERRAIN_BASE)

    // Generate with sine waves
    const freq1 = 0.02 + Math.random() * 0.03
    const freq2 = 0.05 + Math.random() * 0.04
    const amp1 = 3 + Math.random() * 5
    const amp2 = 1 + Math.random() * 3
    const phase1 = Math.random() * Math.PI * 2
    const phase2 = Math.random() * Math.PI * 2

    for (let c = 0; c < cols; c++) {
      const h = baseHeight +
        Math.floor(Math.sin(c * freq1 + phase1) * amp1) +
        Math.floor(Math.sin(c * freq2 + phase2) * amp2)
      terrain[c] = Math.max(3, Math.min(rows - 4, h))
    }
  }

  function initGame() {
    generateTerrain()
    wind = (Math.random() - 0.5) * WIND_MAX * 2

    const tank1Col = Math.floor(cols * 0.15) + Math.floor(Math.random() * (cols * 0.1))
    const tank2Col = Math.floor(cols * 0.75) + Math.floor(Math.random() * (cols * 0.1))

    tanks = [
      {
        col: tank1Col,
        hp: 100,
        maxHp: 100,
        angle: 45,
        power: 50,
        color: '#34d399',
        name: 'P1',
      },
      {
        col: tank2Col,
        hp: 100,
        maxHp: 100,
        angle: 135,
        power: 50,
        color: '#fb7185',
        name: 'P2',
      },
    ]

    // Flatten terrain under tanks
    for (const tank of tanks) {
      for (let c = tank.col - 2; c <= tank.col + 2; c++) {
        if (c >= 0 && c < cols) {
          terrain[c] = terrain[tank.col]!
        }
      }
    }

    currentPlayer = 0
    state = 'AIMING'
    projectile = null
    debris = []
    updateTurnInfo()
  }

  function updateTurnInfo() {
    const tank = tanks[currentPlayer]!
    if (state === 'GAME_OVER') {
      const winner = tanks[0]!.hp > 0 ? tanks[0]! : tanks[1]!
      turnInfo.textContent = `${winner.name} wins! Score: ${scores[0]} - ${scores[1]}`
      turnInfo.style.color = winner.color
    } else {
      turnInfo.textContent = `${tank.name}'s turn | Angle: ${Math.round(tank.angle)}° | Power: ${Math.round(tank.power)}%`
      turnInfo.style.color = tank.color
    }
  }

  let projectileAge = 0

  function fire() {
    if (state !== 'AIMING') return
    const tank = tanks[currentPlayer]!
    const startCol = tank.col
    const terrainH = terrain[startCol] ?? 5
    const startX = startCol * cellWidth + cellWidth / 2
    // Launch from well above the tank (6 cells up)
    const startY = (rows - terrainH - 6) * cellHeight

    const rad = (tank.angle * Math.PI) / 180
    const speed = tank.power * 6
    projectile = {
      x: startX,
      y: startY,
      vx: Math.cos(rad) * speed * (currentPlayer === 0 ? 1 : -1),
      vy: -Math.sin(rad) * speed,
      trail: [],
    }
    projectileAge = 0
    state = 'FIRING'
    updateTurnInfo()
  }

  function explode(x: number, y: number, radius: number) {
    // Destroy terrain
    const colCenter = Math.floor(x / cellWidth)
    const rowCenter = Math.floor(y / cellHeight)
    const cellRadius = Math.ceil(radius / cellWidth)

    for (let dc = -cellRadius; dc <= cellRadius; dc++) {
      const c = colCenter + dc
      if (c < 0 || c >= cols) continue
      for (let dr = -cellRadius; dr <= cellRadius; dr++) {
        const dist = Math.sqrt(dc * dc + dr * dr)
        if (dist <= cellRadius) {
          const terrainRow = rows - (terrain[c] ?? 0)
          const affectedRow = rowCenter + dr
          if (affectedRow >= terrainRow) {
            // This cell is terrain, remove it
            const removedRows = Math.max(0, rows - affectedRow - (rows - (terrain[c] ?? 0)))
            if (removedRows > 0) {
              terrain[c] = Math.max(0, (terrain[c] ?? 0) - 1)
            }
          }
        }
      }
    }

    // More aggressive terrain removal
    for (let dc = -cellRadius; dc <= cellRadius; dc++) {
      const c = colCenter + dc
      if (c < 0 || c >= cols) continue
      const dist = Math.abs(dc)
      const removalHeight = Math.max(0, cellRadius - dist + 1)
      terrain[c] = Math.max(0, (terrain[c] ?? 0) - removalHeight)
    }

    // Spawn debris
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 200
      debris.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        char: [BLOCK_CHARS.solid, BLOCK_CHARS.surface, '*', '.'][Math.floor(Math.random() * 4)]!,
        life: 40 + Math.random() * 40,
        color: ['#fbbf24', '#fb923c', '#fb7185', '#f97316'][Math.floor(Math.random() * 4)]!,
      })
    }

    // Damage tanks
    for (let t = 0; t < tanks.length; t++) {
      const tank = tanks[t]!
      const tankX = tank.col * cellWidth + cellWidth / 2
      const tankY = (rows - (terrain[tank.col] ?? 0) - 2) * cellHeight
      const dx = tankX - x
      const dy = tankY - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < radius * 2.5) {
        const dmg = Math.round(Math.max(0, 50 * (1 - dist / (radius * 2.5))))
        tank.hp = Math.max(0, tank.hp - dmg)
      }
    }
  }

  function nextTurn() {
    // Check for game over
    for (let t = 0; t < tanks.length; t++) {
      if (tanks[t]!.hp <= 0) {
        state = 'GAME_OVER'
        const winnerIdx = t === 0 ? 1 : 0
        scores[winnerIdx] = (scores[winnerIdx] ?? 0) + 1
        updateTurnInfo()
        return
      }
    }

    currentPlayer = 1 - currentPlayer
    wind += (Math.random() - 0.5) * 40
    wind = Math.max(-WIND_MAX, Math.min(WIND_MAX, wind))
    state = 'AIMING'
    updateTurnInfo()

    // AI turn
    if (aiEnabled && currentPlayer === 1) {
      setTimeout(aiTurn, 600)
    }
  }

  function aiTurn() {
    if (state !== 'AIMING' || currentPlayer !== 1) return
    const ai = tanks[1]!
    const target = tanks[0]!

    // Simple AI: aim at player 1 with some randomness
    const dx = (target.col - ai.col) * cellWidth
    const dy = 0
    const dist = Math.abs(dx)

    // Rough angle calculation
    let angle = 90 + Math.atan2(dx, dist) * (180 / Math.PI)
    angle = Math.max(91, Math.min(170, angle + (Math.random() - 0.5) * 20))
    ai.angle = angle
    ai.power = Math.min(90, Math.max(30, dist / 8 + (Math.random() - 0.5) * 15))

    setTimeout(() => fire(), 400)
  }

  // Controls
  fireBtn.addEventListener('click', fire)
  newGameBtn.addEventListener('click', initGame)
  aiToggle.addEventListener('change', () => {
    aiEnabled = aiToggle.checked
  })

  document.addEventListener('keydown', (e) => {
    if (state !== 'AIMING') return
    const tank = tanks[currentPlayer]!
    const isP2 = currentPlayer === 1

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        tank.angle = Math.min(180, tank.angle + 2)
        break
      case 'ArrowRight':
        e.preventDefault()
        tank.angle = Math.max(0, tank.angle - 2)
        break
      case 'ArrowUp':
        e.preventDefault()
        tank.power = Math.min(100, tank.power + 2)
        break
      case 'ArrowDown':
        e.preventDefault()
        tank.power = Math.max(5, tank.power - 2)
        break
      case ' ':
        e.preventDefault()
        fire()
        break
    }
    updateTurnInfo()
  })

  // Mouse/touch aiming
  function getCanvasPos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  canvas.addEventListener('mousedown', (e) => {
    if (state !== 'AIMING') return
    aimDragStart = getCanvasPos(e)
  })

  canvas.addEventListener('mousemove', (e) => {
    if (!aimDragStart || state !== 'AIMING') return
    const pos = getCanvasPos(e)
    const tank = tanks[currentPlayer]!
    const tankX = tank.col * cellWidth + cellWidth / 2
    const tankY = (rows - (terrain[tank.col] ?? 0) - 2) * cellHeight

    const dx = pos.x - tankX
    const dy = tankY - pos.y // invert Y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    tank.angle = Math.max(0, Math.min(180, angle))

    const dist = Math.sqrt(dx * dx + (pos.y - tankY) * (pos.y - tankY))
    tank.power = Math.min(100, Math.max(5, dist / 3))
    updateTurnInfo()
  })

  canvas.addEventListener('mouseup', () => {
    aimDragStart = null
  })

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    if (state !== 'AIMING') return
    aimDragStart = getCanvasPos(e.touches[0]!)
  })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (!aimDragStart || state !== 'AIMING') return
    const pos = getCanvasPos(e.touches[0]!)
    const tank = tanks[currentPlayer]!
    const tankX = tank.col * cellWidth + cellWidth / 2
    const tankY = (rows - (terrain[tank.col] ?? 0) - 2) * cellHeight
    const dx = pos.x - tankX
    const dy = tankY - pos.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    tank.angle = Math.max(0, Math.min(180, angle))
    const dist = Math.sqrt(dx * dx + (pos.y - tankY) * (pos.y - tankY))
    tank.power = Math.min(100, Math.max(5, dist / 3))
    updateTurnInfo()
  })

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault()
    aimDragStart = null
  })

  new ResizeObserver(() => {
    setupCanvas()
    // Regenerate terrain dimensions
    const newCols = Math.floor(canvasWidth / cellWidth)
    if (newCols !== cols) {
      cols = newCols
      rows = Math.floor(canvasHeight / cellHeight)
      initGame()
    }
  }).observe(wrapper)

  // Render loop
  let lastTime = performance.now()

  function render(now: number) {
    const rawDt = (now - lastTime) / 1000
    const dt = Math.min(rawDt, 1 / 30)
    lastTime = now

    setupCanvas()

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw stars
    ctx.fillStyle = '#333'
    ctx.font = '10px Inter'
    for (let i = 0; i < 30; i++) {
      // Deterministic star positions
      const sx = ((i * 137.5) % canvasWidth)
      const sy = ((i * 73.1 + 20) % (canvasHeight * 0.5))
      ctx.fillText('.', sx, sy)
    }

    // Draw wind indicator
    ctx.font = UI_FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#888'
    const windText = wind > 0 ? `Wind ${'→'.repeat(Math.ceil(Math.abs(wind) / 20))} ${Math.round(Math.abs(wind))}` : wind < 0 ? `${Math.round(Math.abs(wind))} ${'←'.repeat(Math.ceil(Math.abs(wind) / 20))} Wind` : 'Wind: Calm'
    ctx.fillText(windText, canvasWidth / 2, 8)

    // Draw score
    ctx.font = SMALL_FONT
    ctx.textAlign = 'left'
    ctx.fillStyle = tanks[0]!.color
    ctx.fillText(`${tanks[0]!.name}: ${scores[0]}`, 10, 8)
    ctx.textAlign = 'right'
    ctx.fillStyle = tanks[1]!.color
    ctx.fillText(`${tanks[1]!.name}: ${scores[1]}`, canvasWidth - 10, 8)

    // Draw terrain
    ctx.font = GAME_FONT
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    for (let c = 0; c < cols; c++) {
      const h = terrain[c] ?? 0
      const x = c * cellWidth

      for (let r = 0; r < h; r++) {
        const y = (rows - r - 1) * cellHeight
        if (r === h - 1) {
          // Surface
          const surfaceGreen = 100 + Math.floor(Math.sin(c * 0.3) * 30)
          ctx.fillStyle = `rgb(50,${surfaceGreen},50)`
          ctx.fillText(BLOCK_CHARS.surface, x, y)
        } else {
          // Solid terrain
          const depth = 1 - r / h
          const brown = Math.floor(60 + depth * 40)
          ctx.fillStyle = `rgb(${brown + 20},${brown},${Math.floor(brown * 0.5)})`
          ctx.fillText(BLOCK_CHARS.solid, x, y)
        }
      }
    }

    // Draw tanks
    for (let t = 0; t < tanks.length; t++) {
      const tank = tanks[t]!
      const th = terrain[tank.col] ?? 0
      const tankBaseRow = rows - th - 1
      const art = t === 0 ? TANK_ART_L : TANK_ART_R

      ctx.fillStyle = tank.hp > 0 ? tank.color : '#555'
      ctx.font = GAME_FONT

      for (let r = 0; r < art.length; r++) {
        const line = art[r]!
        const x = (tank.col - 2) * cellWidth
        const y = (tankBaseRow - (art.length - 1 - r)) * cellHeight
        ctx.fillText(line, x, y)
      }

      // Barrel direction indicator
      const barrelLen = 25
      const tankCenterX = tank.col * cellWidth + cellWidth / 2
      const tankCenterY = (tankBaseRow - 2) * cellHeight + cellHeight / 2
      const rad = (tank.angle * Math.PI) / 180
      const bx = tankCenterX + Math.cos(rad) * barrelLen
      const by = tankCenterY - Math.sin(rad) * barrelLen

      ctx.strokeStyle = tank.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(tankCenterX, tankCenterY)
      ctx.lineTo(bx, by)
      ctx.stroke()

      // HP bar
      const hpBarWidth = 40
      const hpBarHeight = 4
      const hpX = tankCenterX - hpBarWidth / 2
      const hpY = (tankBaseRow - art.length - 1) * cellHeight

      ctx.fillStyle = '#333'
      ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight)
      const hpRatio = tank.hp / tank.maxHp
      ctx.fillStyle = hpRatio > 0.5 ? '#34d399' : hpRatio > 0.25 ? '#fbbf24' : '#fb7185'
      ctx.fillRect(hpX, hpY, hpBarWidth * hpRatio, hpBarHeight)

      // HP text
      ctx.font = SMALL_FONT
      ctx.textAlign = 'center'
      ctx.fillStyle = tank.color
      ctx.fillText(`${tank.hp}HP`, tankCenterX, hpY - 14)

      // Power bar (only for aiming player)
      if (state === 'AIMING' && t === currentPlayer) {
        const pwrY = hpY - 28
        ctx.fillStyle = '#222'
        ctx.fillRect(hpX, pwrY, hpBarWidth, hpBarHeight)
        ctx.fillStyle = '#818cf8'
        ctx.fillRect(hpX, pwrY, hpBarWidth * (tank.power / 100), hpBarHeight)
        ctx.font = SMALL_FONT
        ctx.fillStyle = '#818cf8'
        ctx.fillText(`${Math.round(tank.power)}%`, tankCenterX, pwrY - 14)
      }
    }

    // Update and draw projectile
    if (state === 'FIRING' && projectile) {
      // Sub-step physics for accuracy
      const subSteps = 3
      const subDt = dt / subSteps

      projectileAge += dt

      for (let s = 0; s < subSteps; s++) {
        projectile.vx += wind * subDt
        projectile.vy += GRAVITY * subDt
        projectile.x += projectile.vx * subDt
        projectile.y += projectile.vy * subDt

        projectile.trail.push({ x: projectile.x, y: projectile.y })
        if (projectile.trail.length > 30) projectile.trail.shift()

        // Skip collision checks for the first 0.3s so projectile clears the firing tank
        if (projectileAge < 0.3) continue

        // Check terrain collision
        const pc = Math.floor(projectile.x / cellWidth)
        const pr = Math.floor(projectile.y / cellHeight)

        if (pc >= 0 && pc < cols) {
          const th = terrain[pc] ?? 0
          const terrainTopRow = rows - th
          if (pr >= terrainTopRow) {
            explode(projectile.x, projectile.y, cellWidth * 4)
            projectile = null
            state = 'IMPACT'
            setTimeout(() => nextTurn(), 1200)
            break
          }
        }

        // Check tank collision (skip the firing player's own tank)
        for (let t = 0; t < tanks.length; t++) {
          if (t === currentPlayer && projectileAge < 1) continue
          const tank = tanks[t]!
          const tankX = tank.col * cellWidth + cellWidth / 2
          const tankY = (rows - (terrain[tank.col] ?? 0) - 2) * cellHeight
          const dx = projectile!.x - tankX
          const dy = projectile!.y - tankY
          if (Math.sqrt(dx * dx + dy * dy) < cellWidth * 3) {
            explode(projectile!.x, projectile!.y, cellWidth * 5)
            projectile = null
            state = 'IMPACT'
            setTimeout(() => nextTurn(), 1200)
            break
          }
        }

        if (!projectile) break

        // Out of bounds
        if (projectile.x < -50 || projectile.x > canvasWidth + 50 || projectile.y > canvasHeight + 50) {
          projectile = null
          state = 'IMPACT'
          setTimeout(() => nextTurn(), 500)
          break
        }
      }

      // Draw trail
      if (projectile) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        projectile.trail.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()

        // Draw projectile
        ctx.font = 'bold 16px Inter'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#fbbf24'
        ctx.fillText('\u25CF', projectile.x, projectile.y)
      }
    }

    // Update and draw debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i]!
      d.vy += 200 * dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.life -= 60 * dt

      if (d.life <= 0) {
        debris.splice(i, 1)
        continue
      }

      ctx.globalAlpha = Math.min(1, d.life / 20)
      ctx.fillStyle = d.color
      ctx.font = GAME_FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.char, d.x, d.y)
    }
    ctx.globalAlpha = 1

    // Aim guide (dotted line showing trajectory preview)
    if (state === 'AIMING') {
      const tank = tanks[currentPlayer]!
      const th = terrain[tank.col] ?? 0
      const startX = tank.col * cellWidth + cellWidth / 2
      const startY = (rows - th - 3) * cellHeight
      const rad = (tank.angle * Math.PI) / 180
      const speed = tank.power * 6

      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()

      let px = startX
      let py = startY
      let pvx = Math.cos(rad) * speed
      let pvy = -Math.sin(rad) * speed
      ctx.moveTo(px, py)

      for (let step = 0; step < 40; step++) {
        pvx += wind * 0.016
        pvy += GRAVITY * 0.016
        px += pvx * 0.016
        py += pvy * 0.016
        ctx.lineTo(px, py)

        if (py > canvasHeight || px < 0 || px > canvasWidth) break
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Game over overlay
    if (state === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.font = TITLE_FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const winner = tanks[0]!.hp > 0 ? tanks[0]! : tanks[1]!
      ctx.fillStyle = winner.color
      ctx.fillText(`${winner.name} Wins!`, canvasWidth / 2, canvasHeight / 2 - 20)
      ctx.font = UI_FONT
      ctx.fillStyle = '#aaa'
      ctx.fillText('Press "New Game" to play again', canvasWidth / 2, canvasHeight / 2 + 15)
    }

    requestAnimationFrame(render)
  }

  initGame()
  requestAnimationFrame(render)

  // Source viewer
  await createSourceViewer(document.getElementById('tanks-source')!, {
    code: `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const GAME_FONT = '14px JetBrains Mono'
const BLOCK_CHARS = { solid: '\\u2588', surface: '\\u2591', air: '\\u00B7' }

// Measure each terrain character with pretext for proper spacing
const charWidths = new Map<string, number>()
for (const char of Object.values(BLOCK_CHARS)) {
  const prepared = prepareWithSegments(char, GAME_FONT)
  charWidths.set(char, prepared.widths[0] ?? 8)
}
const cellWidth = charWidths.get(BLOCK_CHARS.solid) ?? 8

// Render terrain using pretext-measured character widths
for (let col = 0; col < cols; col++) {
  const height = terrain[col]
  const x = col * cellWidth  // proportional positioning

  for (let row = 0; row < height; row++) {
    const y = (rows - row - 1) * cellHeight
    const char = row === height - 1 ? BLOCK_CHARS.surface : BLOCK_CHARS.solid
    ctx.fillText(char, x, y)
  }
}

// Projectile physics with gravity and wind
projectile.vx += wind * dt
projectile.vy += GRAVITY * dt
projectile.x += projectile.vx * dt
projectile.y += projectile.vy * dt

// Explosion: destroy terrain in radius, spawn debris chars
function explode(x: number, y: number, radius: number) {
  const colCenter = Math.floor(x / cellWidth)
  for (let dc = -cellRadius; dc <= cellRadius; dc++) {
    const removalHeight = cellRadius - Math.abs(dc) + 1
    terrain[colCenter + dc] -= removalHeight
  }
  // Spawn debris particles as measured characters
  for (let i = 0; i < 20; i++) {
    debris.push({ char: BLOCK_CHARS.surface, x, y, vx: random(), vy: random() })
  }
}`,
    title: 'ASCII Tanks Implementation',
  })
}

init()
