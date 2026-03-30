import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const WAVE_TEXT = 'Pretext makes kinetic typography possible at 60fps'
const SCATTER_TEXT = 'Click to scatter and gather!'

const WAVE_FONT = '28px Inter'
const SCATTER_FONT = '24px Inter'
const WAVE_LINE_HEIGHT = 36
const SCATTER_LINE_HEIGHT = 32

interface CharPos {
  char: string
  x: number
  y: number
  targetX: number
  targetY: number
  scatteredX: number
  scatteredY: number
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Kinetic Typography</h1>
      <p class="content__subtitle">Character-level animation powered by <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutWithLines()</span>.</p>
    </div>

    <div class="content__section">
      <h2>Wave Text</h2>
      <p>Each character has a sine-wave vertical offset animated over time. Pretext provides the baseline positions; we add the wave on top.</p>
      <div class="demo-area demo-area--full" style="height:200px;position:relative;overflow:hidden;" id="wave-wrapper">
        <canvas id="wave-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div id="wave-source" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <h2>Scatter / Gather</h2>
      <p>Characters start in their correct text positions. Click to scatter them randomly, click again to gather them back. Pretext computes the "home" position for each character.</p>
      <div class="demo-area demo-area--full" style="height:200px;position:relative;overflow:hidden;cursor:pointer;" id="scatter-wrapper">
        <canvas id="scatter-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div id="scatter-source" style="margin-top:var(--space-4)"></div>
    </div>
  `

  // --- Wave Text ---
  const waveWrapper = document.getElementById('wave-wrapper')!
  const waveCanvas = document.getElementById('wave-canvas') as HTMLCanvasElement
  const waveCtx = waveCanvas.getContext('2d')!

  const wavePrepared = prepareWithSegments(WAVE_TEXT, WAVE_FONT)

  function getCharPositions(
    prepared: ReturnType<typeof prepareWithSegments>,
    font: string,
    lineHeight: number,
    maxWidth: number,
    offsetX: number,
    offsetY: number,
  ): CharPos[] {
    const result = layoutWithLines(prepared, maxWidth, lineHeight)
    const positions: CharPos[] = []

    // We need a canvas context to measure individual characters
    const measureCtx = document.createElement('canvas').getContext('2d')!
    measureCtx.font = font

    result.lines.forEach((line, lineIdx) => {
      let x = offsetX
      const y = offsetY + lineIdx * lineHeight + lineHeight * 0.7

      for (const char of line.text) {
        if (char === ' ') {
          x += measureCtx.measureText(' ').width
          continue
        }
        const charWidth = measureCtx.measureText(char).width
        positions.push({
          char,
          x,
          y,
          targetX: x,
          targetY: y,
          scatteredX: 0,
          scatteredY: 0,
        })
        x += charWidth
      }
    })

    return positions
  }

  function setupWaveCanvas() {
    const rect = waveWrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    waveCanvas.width = rect.width * dpr
    waveCanvas.height = rect.height * dpr
    waveCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width: rect.width, height: rect.height }
  }

  let waveChars: CharPos[] = []

  function initWaveChars() {
    const { width, height } = setupWaveCanvas()
    const maxWidth = width - 40
    waveChars = getCharPositions(wavePrepared, WAVE_FONT, WAVE_LINE_HEIGHT, maxWidth, 20, height / 2 - WAVE_LINE_HEIGHT)
  }

  initWaveChars()

  let waveAnimId: number
  function animateWave(time: number) {
    const { width, height } = setupWaveCanvas()

    waveCtx.clearRect(0, 0, width, height)
    waveCtx.fillStyle = '#111'
    waveCtx.fillRect(0, 0, width, height)

    waveCtx.font = WAVE_FONT
    waveCtx.textBaseline = 'alphabetic'

    waveChars.forEach((ch, i) => {
      const wave = Math.sin(time / 300 + i * 0.3) * 15
      const hue = (time / 20 + i * 8) % 360
      waveCtx.fillStyle = `hsl(${hue}, 70%, 65%)`
      waveCtx.fillText(ch.char, ch.x, ch.y + wave)
    })

    waveAnimId = requestAnimationFrame(animateWave)
  }

  waveAnimId = requestAnimationFrame(animateWave)

  // Resize handler for wave
  const waveResizeObserver = new ResizeObserver(() => {
    initWaveChars()
  })
  waveResizeObserver.observe(waveWrapper)

  // --- Scatter / Gather ---
  const scatterWrapper = document.getElementById('scatter-wrapper')!
  const scatterCanvas = document.getElementById('scatter-canvas') as HTMLCanvasElement
  const scatterCtx = scatterCanvas.getContext('2d')!

  const scatterPrepared = prepareWithSegments(SCATTER_TEXT, SCATTER_FONT)

  let scatterChars: CharPos[] = []
  let isScattered = false
  let scatterWidth = 0
  let scatterHeight = 0

  function setupScatterCanvas() {
    const rect = scatterWrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    scatterCanvas.width = rect.width * dpr
    scatterCanvas.height = rect.height * dpr
    scatterCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    scatterWidth = rect.width
    scatterHeight = rect.height
    return { width: rect.width, height: rect.height }
  }

  function initScatterChars() {
    const { width, height } = setupScatterCanvas()
    const maxWidth = width - 40
    scatterChars = getCharPositions(scatterPrepared, SCATTER_FONT, SCATTER_LINE_HEIGHT, maxWidth, 20, height / 2 - SCATTER_LINE_HEIGHT / 2)

    // Set scattered positions
    scatterChars.forEach(ch => {
      ch.scatteredX = Math.random() * (width - 30) + 15
      ch.scatteredY = Math.random() * (height - 30) + 25
    })

    // Initialize to target positions
    if (!isScattered) {
      scatterChars.forEach(ch => {
        ch.x = ch.targetX
        ch.y = ch.targetY
      })
    } else {
      scatterChars.forEach(ch => {
        ch.x = ch.scatteredX
        ch.y = ch.scatteredY
      })
    }
  }

  initScatterChars()

  scatterWrapper.addEventListener('click', () => {
    isScattered = !isScattered
    // Assign new scattered positions each time
    if (isScattered) {
      scatterChars.forEach(ch => {
        ch.scatteredX = Math.random() * (scatterWidth - 30) + 15
        ch.scatteredY = Math.random() * (scatterHeight - 30) + 25
      })
    }
  })

  let scatterAnimId: number
  function animateScatter() {
    setupScatterCanvas()

    scatterCtx.clearRect(0, 0, scatterWidth, scatterHeight)
    scatterCtx.fillStyle = '#111'
    scatterCtx.fillRect(0, 0, scatterWidth, scatterHeight)

    scatterCtx.font = SCATTER_FONT
    scatterCtx.textBaseline = 'alphabetic'

    let allSettled = true

    scatterChars.forEach((ch, i) => {
      const targetX = isScattered ? ch.scatteredX : ch.targetX
      const targetY = isScattered ? ch.scatteredY : ch.targetY

      // Lerp toward target
      const ease = 0.08
      ch.x += (targetX - ch.x) * ease
      ch.y += (targetY - ch.y) * ease

      if (Math.abs(ch.x - targetX) > 0.5 || Math.abs(ch.y - targetY) > 0.5) {
        allSettled = false
      }

      const hue = isScattered ? (i * 25) % 360 : 210
      const saturation = isScattered ? 70 : 10
      const lightness = isScattered ? 65 : 75
      scatterCtx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      scatterCtx.fillText(ch.char, ch.x, ch.y)
    })

    // Hint text
    scatterCtx.fillStyle = '#444'
    scatterCtx.font = '12px Inter'
    scatterCtx.textBaseline = 'bottom'
    scatterCtx.fillText(isScattered ? 'Click to gather' : 'Click to scatter', 20, scatterHeight - 10)

    scatterAnimId = requestAnimationFrame(animateScatter)
  }

  scatterAnimId = requestAnimationFrame(animateScatter)

  const scatterResizeObserver = new ResizeObserver(() => {
    initScatterChars()
  })
  scatterResizeObserver.observe(scatterWrapper)

  // Source viewers
  await Promise.all([
    createSourceViewer(document.getElementById('wave-source')!, {
      code: `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments('Wave text!', '28px Inter')
const { lines } = layoutWithLines(prepared, maxWidth, 36)

// Extract character positions from line layout
const chars: { char: string; x: number; y: number }[] = []
lines.forEach((line, lineIdx) => {
  let x = 0
  for (const char of line.text) {
    chars.push({ char, x, y: lineIdx * 36 })
    x += ctx.measureText(char).width
  }
})

// Animate with wave offset
function animate(time: number) {
  chars.forEach((ch, i) => {
    const wave = Math.sin(time / 300 + i * 0.3) * 15
    ctx.fillText(ch.char, ch.x, ch.y + wave)
  })
  requestAnimationFrame(animate)
}`,
      title: 'Wave Text Implementation',
    }),
    createSourceViewer(document.getElementById('scatter-source')!, {
      code: `// Scatter / Gather uses the same character positions
// "Home" positions come from pretext layoutWithLines()
// Scattered positions are random

function animate() {
  chars.forEach(ch => {
    const targetX = isScattered ? ch.scatteredX : ch.homeX
    const targetY = isScattered ? ch.scatteredY : ch.homeY

    // Smooth lerp toward target
    ch.x += (targetX - ch.x) * 0.08
    ch.y += (targetY - ch.y) * 0.08

    ctx.fillText(ch.char, ch.x, ch.y)
  })
  requestAnimationFrame(animate)
}

canvas.addEventListener('click', () => {
  isScattered = !isScattered
})`,
      title: 'Scatter/Gather Implementation',
    }),
  ])
}

init()
