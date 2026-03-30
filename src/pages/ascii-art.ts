import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import { waitForFonts } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const ASCII_CHARS = ' .:-=+*#%@'

const MONO_FONT = '12px JetBrains Mono'
const MONO_LINE_HEIGHT = 14

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">ASCII Art</h1>
      <p class="content__subtitle">Animated proportional ASCII art rendered with pretext-measured character widths via <span class="api-tag">prepareWithSegments()</span> + <span class="api-tag">layoutWithLines()</span>.</p>
    </div>

    <div class="content__section">
      <h2>Animated Particle Field</h2>
      <p>A moving gradient and particle field rendered as ASCII characters. Each character is selected based on pixel brightness. Pretext measures character widths for proper proportional positioning on the canvas.</p>
      <div class="demo-area demo-area--full" style="height:450px;position:relative;overflow:hidden;background:#0a0a0a;" id="ascii-wrapper">
        <canvas id="ascii-canvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div id="ascii-info" style="margin-top:var(--space-3);font-size:var(--text-sm);font-family:var(--font-code);color:var(--color-text-tertiary)"></div>
      <div id="ascii-source" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <div class="explanation">
        <h3>How It Works</h3>
        <p>Traditional ASCII art assumes monospaced fonts where every character has the same width. With proportional fonts, characters like 'W' are wider than 'i', so naive grid-based placement breaks down.</p>
        <p>Pretext solves this by measuring each ASCII character's width with <span class="api-tag">prepareWithSegments()</span>. We build a brightness-to-character map, then for each "pixel" in our virtual grid, we select the character whose brightness matches and position it using the measured width. The result is a flowing ASCII field that respects proportional spacing.</p>
        <div class="key-insight">Even though we use canvas fillText for rendering (not DOM), pretext's character width data ensures proper proportional spacing at any font size.</div>
      </div>
    </div>
  `

  const wrapper = document.getElementById('ascii-wrapper')!
  const canvas = document.getElementById('ascii-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const infoEl = document.getElementById('ascii-info')!

  // Measure character widths using pretext
  const charWidths: Map<string, number> = new Map()

  for (const char of ASCII_CHARS) {
    if (char === ' ') {
      const prepared = prepareWithSegments('a a', MONO_FONT)
      // Space is the second segment
      charWidths.set(' ', prepared.widths[1] ?? 4)
    } else {
      const prepared = prepareWithSegments(char, MONO_FONT)
      charWidths.set(char, prepared.widths[0] ?? 7)
    }
  }

  // Also measure with layoutWithLines to verify line behavior
  const testLine = ASCII_CHARS.repeat(3)
  const testPrepared = prepareWithSegments(testLine, MONO_FONT)
  const testResult = layoutWithLines(testPrepared, 10000, MONO_LINE_HEIGHT)

  const avgCharWidth = (testResult.lines[0]?.width ?? 70) / testLine.length

  // Particles
  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
  }

  const particles: Particle[] = []
  const MAX_PARTICLES = 60

  function spawnParticle(w: number, h: number) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      life: 0,
      maxLife: 100 + Math.random() * 200,
    })
  }

  function getCanvasSize() {
    const rect = wrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width: rect.width, height: rect.height }
  }

  function getBrightness(x: number, y: number, w: number, h: number, time: number): number {
    // Animated gradient
    const nx = x / w
    const ny = y / h
    const t = time / 1000

    // Sine-wave gradient
    let v = Math.sin(nx * 4 + t) * 0.3 +
            Math.sin(ny * 3 - t * 0.7) * 0.3 +
            Math.sin((nx + ny) * 5 + t * 1.3) * 0.2

    // Add particle glow
    for (const p of particles) {
      const dx = x - p.x
      const dy = y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const radius = 40 * (1 - p.life / p.maxLife)
      if (dist < radius) {
        v += (1 - dist / radius) * 0.6 * (1 - p.life / p.maxLife)
      }
    }

    return Math.max(0, Math.min(1, (v + 0.5)))
  }

  let animId: number
  let frameCount = 0

  function animate(time: number) {
    const { width, height } = getCanvasSize()

    // Update particles
    const dt = 1 / 60
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life++
      if (p.life > p.maxLife || p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
        particles.splice(i, 1)
      }
    }

    // Spawn new particles
    while (particles.length < MAX_PARTICLES) {
      spawnParticle(width, height)
    }

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    ctx.font = MONO_FONT
    ctx.textBaseline = 'top'

    const cellWidth = avgCharWidth
    const cellHeight = MONO_LINE_HEIGHT
    const cols = Math.floor(width / cellWidth)
    const rows = Math.floor(height / cellHeight)

    let charsDrawn = 0

    for (let row = 0; row < rows; row++) {
      let x = 0
      const y = row * cellHeight

      for (let col = 0; col < cols; col++) {
        const sampleX = col * cellWidth + cellWidth / 2
        const sampleY = y + cellHeight / 2

        const brightness = getBrightness(sampleX, sampleY, width, height, time)
        const charIndex = Math.floor(brightness * (ASCII_CHARS.length - 1))
        const char = ASCII_CHARS[charIndex]!

        if (char !== ' ') {
          // Color based on brightness and position
          const hue = (time / 30 + col + row * 2) % 360
          const sat = 50 + brightness * 40
          const light = 25 + brightness * 50
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`
          ctx.fillText(char, x, y)
          charsDrawn++
        }

        x += charWidths.get(char) ?? cellWidth
      }
    }

    frameCount++
    if (frameCount % 30 === 0) {
      infoEl.textContent = `${cols}x${rows} grid | ${charsDrawn} chars/frame | avg char width: ${avgCharWidth.toFixed(1)}px`
    }

    animId = requestAnimationFrame(animate)
  }

  animId = requestAnimationFrame(animate)

  const resizeObserver = new ResizeObserver(() => {
    // Animation loop will pick up new size automatically
  })
  resizeObserver.observe(wrapper)

  const sourceCode = `import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const ASCII_CHARS = ' .:-=+*#%@'
const FONT = '12px JetBrains Mono'

// Measure each ASCII character's width with pretext
const charWidths = new Map<string, number>()
for (const char of ASCII_CHARS) {
  const prepared = prepareWithSegments(char, FONT)
  charWidths.set(char, prepared.widths[0] ?? 7)
}

function animate(time: number) {
  const cols = Math.floor(width / avgCharWidth)
  const rows = Math.floor(height / lineHeight)

  for (let row = 0; row < rows; row++) {
    let x = 0
    for (let col = 0; col < cols; col++) {
      // Sample brightness at this grid position
      const brightness = getBrightness(col * cellW, row * cellH, time)

      // Map to ASCII character
      const charIndex = Math.floor(brightness * (ASCII_CHARS.length - 1))
      const char = ASCII_CHARS[charIndex]

      ctx.fillText(char, x, row * lineHeight)

      // Use pretext-measured width for proportional positioning
      x += charWidths.get(char) ?? avgCharWidth
    }
  }

  requestAnimationFrame(animate)
}`

  await createSourceViewer(document.getElementById('ascii-source')!, {
    code: sourceCode,
    title: 'ASCII Art Renderer',
  })
}

init()
