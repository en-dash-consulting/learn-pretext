import { prepare, layout } from '@chenglou/pretext'
import type { PreparedText } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const TEXTS = [
  'The quick brown fox',
  'Pretext measures text at the speed of arithmetic',
  'Hello world',
  'Sphinx of black quartz judge my vow',
  'Pack my box with five dozen liquor jugs',
  'How vexingly quick daft zebras jump',
  'The five boxing wizards jump quickly',
  'Amazingly few discotheques provide jukeboxes',
  'Typography is the craft of endowing human language with a durable visual form',
  'Measure twice cut once',
  'Text reflow is the game',
  'Instant layout prediction',
  'Waltz bad nymph for quick jigs vex',
  'Bright vixens jump dozy fowl quack',
  'Two driven jocks help fax my big quiz',
  'The jay pig fox zebra and my wolves quack',
  'A quick movement of the enemy will jeopardize six gunboats',
  'All questions asked by five watch experts amazed the judge',
  'Width changes everything',
  'Every line break matters',
]

const BLOCK_FONT = '14px Inter'
const BLOCK_LINE_HEIGHT = 20
const BLOCK_PADDING = 8

const WIDTH_STATES = [100, 180, 280, 380]

const FIELD_WIDTH = 400
const FIELD_HEIGHT = 600
const FALL_SPEED = 40 // pixels per second
const SOFT_DROP_MULTIPLIER = 8
const MOVE_SPEED = 200 // pixels per second

interface TextBlock {
  text: string
  prepared: PreparedText
  x: number
  y: number
  widthIndex: number
  currentWidth: number
  targetWidth: number
  currentHeight: number
  targetHeight: number
  lineCount: number
  hue: number
  placed: boolean
  animTime: number
}

interface PlacedBlock {
  text: string
  x: number
  y: number
  width: number
  height: number
  lineCount: number
  hue: number
  opacity: number
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Text Tetris</h1>
      <p class="content__subtitle">Falling text blocks whose shape changes when you rotate them. Rotating cycles the block's width constraint, and <span class="api-tag">layout()</span> instantly computes the new height. Text reflow IS the game mechanic.</p>
    </div>

    <div class="content__section">
      <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;align-items:flex-start;">
        <div style="flex:0 0 auto;">
          <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-3);flex-wrap:wrap;align-items:center;">
            <button id="tetris-start" class="btn btn--primary">Start</button>
            <button id="tetris-reset" class="btn btn--secondary">Reset</button>
            <div id="tetris-score" style="font-size:var(--text-sm);color:var(--color-text-secondary);font-family:var(--font-code);">Score: 0</div>
          </div>
          <div class="demo-area" style="width:${FIELD_WIDTH}px;height:${FIELD_HEIGHT}px;position:relative;overflow:hidden;touch-action:none;outline:none;" id="tetris-field" tabindex="0">
            <canvas id="tetris-canvas" style="width:100%;height:100%;display:block;"></canvas>
          </div>
          <p style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-text-tertiary);">Arrow keys to move/rotate. Space for hard drop. Tap to rotate, swipe to move.</p>
        </div>
        <div style="flex:1 1 200px;min-width:200px;">
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-3);">
            <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">NEXT BLOCK</div>
            <div id="tetris-next" style="min-height:80px;display:flex;align-items:center;justify-content:center;"></div>
          </div>
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-3);">
            <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">STATS</div>
            <div id="tetris-stats" style="font-size:var(--text-sm);font-family:var(--font-code);color:var(--color-text-secondary);line-height:1.8;"></div>
          </div>
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);">
            <div style="font-size:var(--text-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">PRETEXT LIVE</div>
            <div id="tetris-pretext-info" style="font-size:var(--text-xs);font-family:var(--font-code);color:var(--color-accent);line-height:1.8;"></div>
          </div>
        </div>
      </div>
      <div id="tetris-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  const field = document.getElementById('tetris-field')!
  const canvas = document.getElementById('tetris-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const startBtn = document.getElementById('tetris-start')!
  const resetBtn = document.getElementById('tetris-reset')!
  const scoreEl = document.getElementById('tetris-score')!
  const nextEl = document.getElementById('tetris-next')!
  const statsEl = document.getElementById('tetris-stats')!
  const pretextInfoEl = document.getElementById('tetris-pretext-info')!

  // Setup canvas with device pixel ratio
  const dpr = window.devicePixelRatio || 1
  canvas.width = FIELD_WIDTH * dpr
  canvas.height = FIELD_HEIGHT * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Prepare all texts with pretext
  const preparedTexts: { text: string; prepared: PreparedText; hue: number }[] = []
  for (const text of TEXTS) {
    const prepared = prepare(text, BLOCK_FONT)
    // Hue based on text length: short=warm(0-60), long=cool(180-260)
    const t = Math.min(text.length / 60, 1)
    const hue = 20 + t * 220
    preparedTexts.push({ text, prepared, hue })
  }

  // Game state
  let running = false
  let gameOver = false
  let score = 0
  let blocksPlaced = 0
  let layoutCalls = 0
  let totalLayoutTime = 0
  let activeBlock: TextBlock | null = null
  let nextBlockIndex = -1
  let placedBlocks: PlacedBlock[] = []
  let softDrop = false
  let moveDir = 0 // -1 left, 0 none, 1 right
  let lastLayoutInfo = ''

  function getRandomBlockIndex(): number {
    return Math.floor(Math.random() * preparedTexts.length)
  }

  function computeBlockDimensions(prepared: PreparedText, widthIndex: number): { width: number; height: number; lineCount: number; elapsed: number } {
    const maxWidth = WIDTH_STATES[widthIndex]!
    const innerWidth = maxWidth - BLOCK_PADDING * 2
    const { result, elapsed } = timeExecution(() => layout(prepared, innerWidth, BLOCK_LINE_HEIGHT))
    layoutCalls++
    totalLayoutTime += elapsed
    return {
      width: maxWidth,
      height: result.height + BLOCK_PADDING * 2,
      lineCount: result.lineCount,
      elapsed,
    }
  }

  function createBlock(index: number): TextBlock {
    const { text, prepared, hue } = preparedTexts[index]!
    const widthIndex = 2 // Start at 280px
    const dims = computeBlockDimensions(prepared, widthIndex)
    return {
      text,
      prepared,
      x: (FIELD_WIDTH - dims.width) / 2,
      y: -dims.height,
      widthIndex,
      currentWidth: dims.width,
      targetWidth: dims.width,
      currentHeight: dims.height,
      targetHeight: dims.height,
      lineCount: dims.lineCount,
      hue,
      placed: false,
      animTime: 0,
    }
  }

  function spawnBlock() {
    if (nextBlockIndex < 0) {
      nextBlockIndex = getRandomBlockIndex()
    }
    activeBlock = createBlock(nextBlockIndex)
    nextBlockIndex = getRandomBlockIndex()
    updateNextPreview()
  }

  function updateNextPreview() {
    if (nextBlockIndex < 0) return
    const { text, hue } = preparedTexts[nextBlockIndex]!
    nextEl.innerHTML = `<div style="
      background:hsla(${hue}, 70%, 50%, 0.15);
      border:1px solid hsla(${hue}, 70%, 50%, 0.4);
      border-radius:6px;
      padding:6px 10px;
      font-size:var(--text-xs);
      color:hsla(${hue}, 70%, 75%, 1);
      max-width:200px;
      text-align:center;
      line-height:1.4;
    ">${text}</div>`
  }

  function getFloorY(block: TextBlock): number {
    let floorY = FIELD_HEIGHT - block.currentHeight
    const blockLeft = block.x
    const blockRight = block.x + block.currentWidth

    for (const placed of placedBlocks) {
      const pLeft = placed.x
      const pRight = placed.x + placed.width
      // Check horizontal overlap
      if (blockRight > pLeft + 2 && blockLeft < pRight - 2) {
        const topOfPlaced = placed.y
        const potentialFloor = topOfPlaced - block.currentHeight
        if (potentialFloor < floorY) {
          floorY = potentialFloor
        }
      }
    }

    return floorY
  }

  const CLEAR_THRESHOLD = 0.80 // 80% coverage to clear
  const SCAN_BAND = LINE_HEIGHT // scan in line-height bands
  let linesCleared = 0

  function checkLineClear() {
    // Scan horizontal bands from bottom to top
    let y = FIELD_HEIGHT - SCAN_BAND
    let cleared = false

    while (y > 0) {
      // Calculate coverage of this band
      let coveredWidth = 0
      for (const b of placedBlocks) {
        // Does this block overlap the band [y, y + SCAN_BAND]?
        if (b.y < y + SCAN_BAND && b.y + b.height > y) {
          coveredWidth += b.width
        }
      }

      const coverage = coveredWidth / FIELD_WIDTH
      if (coverage >= CLEAR_THRESHOLD) {
        // Remove all blocks that overlap this band
        const toRemove = placedBlocks.filter(b => b.y < y + SCAN_BAND && b.y + b.height > y)
        for (const b of toRemove) {
          const idx = placedBlocks.indexOf(b)
          if (idx >= 0) placedBlocks.splice(idx, 1)
        }
        linesCleared++
        score += 100 * linesCleared // combo bonus
        cleared = true

        // Drop blocks above the cleared band
        for (const b of placedBlocks) {
          if (b.y < y) {
            b.y += SCAN_BAND
          }
        }
        // Re-scan same y since blocks dropped
        continue
      }

      y -= SCAN_BAND
    }

    if (cleared) {
      scoreEl.textContent = `Score: ${score}`
    }
  }

  function placeBlock(block: TextBlock) {
    const floorY = getFloorY(block)
    placedBlocks.push({
      text: block.text,
      x: block.x,
      y: floorY,
      width: block.currentWidth,
      height: block.currentHeight,
      lineCount: block.lineCount,
      hue: block.hue,
      opacity: 1,
    })
    blocksPlaced++

    // Score: bonus for wider blocks (more efficient packing)
    const widthRatio = block.currentWidth / FIELD_WIDTH
    const efficiency = Math.round(widthRatio * 100)
    score += 10 + efficiency
    scoreEl.textContent = `Score: ${score}`

    // Check for line clears: scan horizontal bands
    // A band clears if blocks cover >= 80% of its width
    checkLineClear()

    // Check game over: if any placed block's top is above the field
    const highestY = placedBlocks.length > 0 ? Math.min(...placedBlocks.map(b => b.y)) : FIELD_HEIGHT
    if (highestY <= 10) {
      gameOver = true
      running = false
      startBtn.textContent = 'Game Over'
      startBtn.style.opacity = '0.5'
    } else {
      spawnBlock()
    }
  }

  function rotateBlock() {
    if (!activeBlock || activeBlock.placed) return
    const oldWidthIndex = activeBlock.widthIndex
    activeBlock.widthIndex = (activeBlock.widthIndex + 1) % WIDTH_STATES.length
    const dims = computeBlockDimensions(activeBlock.prepared, activeBlock.widthIndex)

    activeBlock.targetWidth = dims.width
    activeBlock.targetHeight = dims.height
    activeBlock.lineCount = dims.lineCount

    // Update live pretext info
    lastLayoutInfo = `width: ${WIDTH_STATES[activeBlock.widthIndex]}px
lines: ${dims.lineCount}
height: ${dims.height.toFixed(1)}px
layout(): ${dims.elapsed.toFixed(3)}ms`

    // Keep block on screen
    if (activeBlock.x + dims.width > FIELD_WIDTH) {
      activeBlock.x = FIELD_WIDTH - dims.width
    }
    if (activeBlock.x < 0) activeBlock.x = 0
  }

  // Input handling
  const keysDown = new Set<string>()

  field.addEventListener('keydown', (e) => {
    if (!running || gameOver) return
    keysDown.add(e.key)

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      rotateBlock()
    }
    if (e.key === ' ') {
      e.preventDefault()
      // Hard drop
      if (activeBlock && !activeBlock.placed) {
        const floorY = getFloorY(activeBlock)
        activeBlock.y = floorY
        placeBlock(activeBlock)
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      softDrop = true
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      moveDir = -1
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      moveDir = 1
    }
  })

  field.addEventListener('keyup', (e) => {
    keysDown.delete(e.key)
    if (e.key === 'ArrowDown') softDrop = false
    if (e.key === 'ArrowLeft' && moveDir === -1) moveDir = 0
    if (e.key === 'ArrowRight' && moveDir === 1) moveDir = 0
  })

  // Touch controls
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let touchMoved = false

  field.addEventListener('touchstart', (e) => {
    e.preventDefault()
    if (!running || gameOver) return
    const touch = e.touches[0]!
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = performance.now()
    touchMoved = false
  })

  field.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (!running || gameOver || !activeBlock) return
    const touch = e.touches[0]!
    const dx = touch.clientX - touchStartX
    const dy = touch.clientY - touchStartY

    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      touchMoved = true
    }

    // Horizontal movement
    if (Math.abs(dx) > 30) {
      const rect = field.getBoundingClientRect()
      const fieldX = touch.clientX - rect.left
      activeBlock.x = Math.max(0, Math.min(FIELD_WIDTH - activeBlock.currentWidth, fieldX - activeBlock.currentWidth / 2))
      touchStartX = touch.clientX
    }

    // Swipe down for soft drop
    if (dy > 40) {
      softDrop = true
    }
  })

  field.addEventListener('touchend', (e) => {
    e.preventDefault()
    softDrop = false
    // Tap to rotate
    if (!touchMoved && performance.now() - touchStartTime < 300) {
      rotateBlock()
    }
  })

  // Start / Reset
  function resetGame() {
    running = false
    gameOver = false
    score = 0
    blocksPlaced = 0
    layoutCalls = 0
    totalLayoutTime = 0
    activeBlock = null
    nextBlockIndex = -1
    placedBlocks = []
    softDrop = false
    moveDir = 0
    lastLayoutInfo = ''
    scoreEl.textContent = 'Score: 0'
    startBtn.textContent = 'Start'
    startBtn.style.opacity = '1'
    statsEl.textContent = ''
    pretextInfoEl.textContent = ''
    nextEl.innerHTML = ''
  }

  startBtn.addEventListener('click', () => {
    if (gameOver) {
      resetGame()
      return
    }
    if (!running) {
      running = true
      startBtn.textContent = 'Pause'
      field.focus()
      spawnBlock()
    } else {
      running = false
      startBtn.textContent = 'Resume'
    }
  })

  resetBtn.addEventListener('click', resetGame)

  // Draw helpers
  function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
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

  function wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    ctx.font = BLOCK_FONT
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  }

  function drawBlock(block: { text: string; x: number; y: number; width: number; height: number; lineCount: number; hue: number }, alpha: number, active: boolean) {
    const x = block.x
    const y = block.y
    const w = block.width
    const h = block.height

    // Block background
    drawRoundedRect(x, y, w, h, 6)
    ctx.fillStyle = `hsla(${block.hue}, 70%, 50%, ${0.12 * alpha})`
    ctx.fill()
    ctx.strokeStyle = `hsla(${block.hue}, 70%, 50%, ${(active ? 0.7 : 0.35) * alpha})`
    ctx.lineWidth = active ? 2 : 1
    ctx.stroke()

    // Active glow
    if (active) {
      ctx.shadowColor = `hsla(${block.hue}, 70%, 50%, 0.3)`
      ctx.shadowBlur = 12
      drawRoundedRect(x, y, w, h, 6)
      ctx.strokeStyle = `hsla(${block.hue}, 70%, 50%, 0.15)`
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Text inside the block
    ctx.font = BLOCK_FONT
    ctx.fillStyle = `hsla(${block.hue}, 70%, 80%, ${0.9 * alpha})`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const innerWidth = w - BLOCK_PADDING * 2
    const lines = wrapText(block.text, innerWidth)
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, x + BLOCK_PADDING, y + BLOCK_PADDING + i * BLOCK_LINE_HEIGHT, innerWidth)
    }

    // Dimension label for active block
    if (active) {
      ctx.font = '10px Inter'
      ctx.fillStyle = `hsla(${block.hue}, 70%, 70%, 0.7)`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`${Math.round(w)}x${Math.round(h)} (${block.lineCount}L)`, x + w - 4, y - 3)
    }
  }

  // Render loop
  let lastTime = performance.now()

  function render(now: number) {
    const rawDt = (now - lastTime) / 1000
    const dt = Math.min(rawDt, 1 / 30)
    lastTime = now

    // Clear
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

    // Background
    ctx.fillStyle = '#06060f'
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    for (let gx = 0; gx < FIELD_WIDTH; gx += 20) {
      ctx.beginPath()
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, FIELD_HEIGHT)
      ctx.stroke()
    }
    for (let gy = 0; gy < FIELD_HEIGHT; gy += 20) {
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.lineTo(FIELD_WIDTH, gy)
      ctx.stroke()
    }

    // Update and draw active block
    if (running && activeBlock && !gameOver) {
      // Smooth dimension transitions
      const lerpRate = 1 - Math.pow(0.001, dt)
      activeBlock.currentWidth += (activeBlock.targetWidth - activeBlock.currentWidth) * lerpRate
      activeBlock.currentHeight += (activeBlock.targetHeight - activeBlock.currentHeight) * lerpRate

      // Snap if close enough
      if (Math.abs(activeBlock.currentWidth - activeBlock.targetWidth) < 0.5) {
        activeBlock.currentWidth = activeBlock.targetWidth
      }
      if (Math.abs(activeBlock.currentHeight - activeBlock.targetHeight) < 0.5) {
        activeBlock.currentHeight = activeBlock.targetHeight
      }

      // Horizontal movement
      if (moveDir !== 0) {
        activeBlock.x += moveDir * MOVE_SPEED * dt
        activeBlock.x = Math.max(0, Math.min(FIELD_WIDTH - activeBlock.currentWidth, activeBlock.x))
      }

      // Fall
      const speed = softDrop ? FALL_SPEED * SOFT_DROP_MULTIPLIER : FALL_SPEED
      activeBlock.y += speed * dt

      // Check landing
      const floorY = getFloorY(activeBlock)
      if (activeBlock.y >= floorY) {
        activeBlock.y = floorY
        placeBlock(activeBlock)
      }

      // Draw ghost (drop preview)
      if (activeBlock && !activeBlock.placed) {
        const ghostY = getFloorY(activeBlock)
        ctx.globalAlpha = 0.15
        drawBlock({
          text: activeBlock.text,
          x: activeBlock.x,
          y: ghostY,
          width: activeBlock.currentWidth,
          height: activeBlock.currentHeight,
          lineCount: activeBlock.lineCount,
          hue: activeBlock.hue,
        }, 1, false)
        ctx.globalAlpha = 1
      }
    }

    // Draw placed blocks
    for (const placed of placedBlocks) {
      drawBlock({
        text: placed.text,
        x: placed.x,
        y: placed.y,
        width: placed.width,
        height: placed.height,
        lineCount: placed.lineCount,
        hue: placed.hue,
      }, 0.6, false)
    }

    // Draw active block on top
    if (activeBlock && !activeBlock.placed) {
      drawBlock({
        text: activeBlock.text,
        x: activeBlock.x,
        y: activeBlock.y,
        width: activeBlock.currentWidth,
        height: activeBlock.currentHeight,
        lineCount: activeBlock.lineCount,
        hue: activeBlock.hue,
      }, 1, true)
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT)
      ctx.font = '28px Inter'
      ctx.fillStyle = '#fb7185'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('GAME OVER', FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 20)
      ctx.font = '16px Inter'
      ctx.fillStyle = '#ededf0'
      ctx.fillText(`Score: ${score}`, FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 15)
      ctx.font = '12px Inter'
      ctx.fillStyle = 'rgba(237, 237, 240, 0.5)'
      ctx.fillText('Click "Reset" to play again', FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 45)
    }

    // Idle state
    if (!running && !gameOver && blocksPlaced === 0) {
      ctx.font = '16px Inter'
      ctx.fillStyle = 'rgba(237, 237, 240, 0.3)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Press "Start" to play', FIELD_WIDTH / 2, FIELD_HEIGHT / 2)
      ctx.font = '12px Inter'
      ctx.fillStyle = 'rgba(237, 237, 240, 0.2)'
      ctx.fillText('Rotate blocks to change width & reflow text', FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 25)
    }

    // Update stats panel
    statsEl.innerHTML = `Blocks: ${blocksPlaced}<br>Score: ${score}<br>layout() calls: ${layoutCalls}`

    // Update pretext info panel
    if (lastLayoutInfo) {
      pretextInfoEl.innerHTML = lastLayoutInfo.split('\n').join('<br>')
    }
    if (layoutCalls > 0) {
      const avgTime = totalLayoutTime / layoutCalls
      pretextInfoEl.innerHTML += `<br><span style="color:var(--color-success);">avg: ${avgTime.toFixed(3)}ms</span>`
    }

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
  field.focus()

  // Source viewer
  await createSourceViewer(document.getElementById('tetris-source')!, {
    code: `import { prepare, layout } from '@chenglou/pretext'

// Prepare all text blocks once at init
const blocks = texts.map(text => ({
  text,
  prepared: prepare(text, '14px Inter'),
}))

// Width states: rotating cycles through these constraints
const WIDTH_STATES = [100, 180, 280, 380]

// On every rotation, layout() computes the new dimensions
function rotateBlock(block) {
  block.widthIndex = (block.widthIndex + 1) % WIDTH_STATES.length
  const maxWidth = WIDTH_STATES[block.widthIndex]
  const innerWidth = maxWidth - PADDING * 2

  // THIS is the key call: instant height prediction
  const { lineCount, height } = layout(
    block.prepared,
    innerWidth,
    20  // lineHeight
  )

  // A phrase at 380px might be 1 line (height: 36px)
  // At 100px it could be 4 lines (height: 96px)
  // The block shape literally changes because of text reflow
  block.targetWidth = maxWidth
  block.targetHeight = height + PADDING * 2
  block.lineCount = lineCount
}

// Stacking is pixel-based, not grid-based
// Each block occupies its exact pretext-predicted height
function getFloorY(block) {
  let floor = FIELD_HEIGHT - block.height
  for (const placed of placedBlocks) {
    if (overlapsHorizontally(block, placed)) {
      floor = Math.min(floor, placed.y - block.height)
    }
  }
  return floor
}`,
    title: 'Text Tetris: layout() as Game Mechanic',
  })
}

init()
