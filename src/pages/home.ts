import { prepare, layout, prepareWithSegments } from '@chenglou/pretext'
import { waitForFonts, timeExecution } from '../shared/pretext-helpers'
import { tracks } from '../shared/nav-data'

const HERO_TEXT = `Text layout at the speed of arithmetic`
const HERO_FONT = 'bold 3.75rem Inter'
const HERO_LINE_HEIGHT = 68

const SUBTITLE_TEXT = `Pretext measures multiline text without the DOM. No reflows, no guesswork — just pure math over cached glyph widths.`

const DEMO_PARAGRAPHS = [
  'Typography is the art of arranging type to make written language legible, readable, and appealing.',
  'The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow.',
  'Pretext computes line breaks with the same algorithm browsers use — but 300x faster.',
  'Resize-driven relayout becomes essentially free when measurement is pure arithmetic.',
  'Virtual scroll, masonry, editorial layouts — all possible at 60fps without touching the DOM.',
]

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  // Prepare demo paragraphs
  const demoPrepared = DEMO_PARAGRAPHS.map(t => ({
    text: t,
    prepared: prepare(t, '16px Inter'),
  }))

  content.innerHTML = `
    <div class="hero" id="hero">
      <canvas id="hero-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>

      <div style="position:relative;z-index:1;">
        <div class="hero__badge" style="display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-1) var(--space-3);background:var(--color-accent-muted);border:1px solid rgba(129,140,248,0.15);border-radius:var(--radius-lg);font-size:var(--text-xs);color:var(--color-accent);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-6);letter-spacing:0.02em;">
          A community learning resource
        </div>

        <h1 class="hero__title" id="hero-title">${HERO_TEXT}</h1>
        <p class="hero__tagline">${SUBTITLE_TEXT}</p>
        <p style="font-size:var(--text-sm);color:var(--color-text-tertiary);max-width:480px;margin:0 auto var(--space-6);text-align:center;">
          Interactive demos and tutorials for <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener" style="color:var(--color-accent);">pretext</a>, created by <a href="https://github.com/chenglou" target="_blank" rel="noopener" style="color:var(--color-accent);">Cheng Lou</a>.
          This site is an independent resource by <a href="https://endash.us" target="_blank" rel="noopener" style="color:var(--color-accent);">En Dash</a>.
        </p>

        <div id="hero-perf" style="display:flex;justify-content:center;gap:var(--space-6);margin-bottom:var(--space-8);flex-wrap:wrap;"></div>

        <a href="/pages/why-pretext.html" class="hero__cta">
          Start Learning &rarr;
        </a>
      </div>
    </div>

    <div style="max-width:920px;margin:0 auto;padding:0 var(--space-6)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-8);margin-bottom:var(--space-16);align-items:start;" id="hero-demo-grid">
        <div>
          <h3 style="font-size:var(--text-sm);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--space-3);">Live measurement</h3>
          <div id="demo-texts" style="display:flex;flex-direction:column;gap:var(--space-3);"></div>
        </div>
        <div>
          <h3 style="font-size:var(--text-sm);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--space-3);">How it works</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-4);">
            <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
              <span style="flex-shrink:0;width:28px;height:28px;border-radius:var(--radius-sm);background:var(--gradient-accent-soft);border:1px solid rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--font-weight-bold);color:var(--color-accent);">1</span>
              <div>
                <div style="font-size:var(--text-sm);font-weight:var(--font-weight-semibold);color:var(--color-text);margin-bottom:2px;">prepare(text, font)</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);">Segment text, measure glyphs via canvas, cache widths. ~0.1ms per text.</div>
              </div>
            </div>
            <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
              <span style="flex-shrink:0;width:28px;height:28px;border-radius:var(--radius-sm);background:var(--gradient-accent-soft);border:1px solid rgba(129,140,248,0.15);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--font-weight-bold);color:var(--color-accent);">2</span>
              <div>
                <div style="font-size:var(--text-sm);font-weight:var(--font-weight-semibold);color:var(--color-text);margin-bottom:2px;">layout(prepared, width, lineHeight)</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);">Pure arithmetic over cached widths. ~0.005ms. Call on every resize, every frame.</div>
              </div>
            </div>
            <div style="display:flex;gap:var(--space-3);align-items:flex-start;">
              <span style="flex-shrink:0;width:28px;height:28px;border-radius:var(--radius-sm);background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.15);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);font-weight:var(--font-weight-bold);color:var(--color-success);">~</span>
              <div>
                <div style="font-size:var(--text-sm);font-weight:var(--font-weight-semibold);color:var(--color-text);margin-bottom:2px;">300-600x faster than DOM</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);">No reflows, no hidden elements, no layout thrashing. Just math.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 style="text-align:center;margin-bottom:var(--space-6);font-size:var(--text-xl);">Explore by track</h2>

      <div class="track-grid" style="margin-bottom:var(--space-12);">
        ${tracks.map(t => `
          <a href="${t.pages[0]!.href}" class="track-card">
            <div class="track-card__title">${t.title}</div>
            <div class="track-card__desc">${t.pages.length} ${t.pages.length === 1 ? 'page' : 'pages'}</div>
          </a>
        `).join('')}
      </div>
    </div>
  `

  // --- Balance the hero title using pretext ---
  function balanceElement(el: HTMLElement, text: string, font: string, lineHeight: number) {
    const prepared = prepare(text, font)
    const maxWidth = el.clientWidth
    const normalResult = layout(prepared, maxWidth, lineHeight)
    if (normalResult.lineCount <= 1) return

    let lo = 0
    let hi = maxWidth
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1
      if (layout(prepared, mid, lineHeight).lineCount <= normalResult.lineCount) {
        hi = mid
      } else {
        lo = mid
      }
    }
    el.style.maxWidth = `${hi}px`
    el.style.marginLeft = 'auto'
    el.style.marginRight = 'auto'
  }

  const heroTitle = document.getElementById('hero-title')!
  // Use computed font since the CSS var --text-4xl resolves at runtime
  const computedFont = getComputedStyle(heroTitle).font
  balanceElement(heroTitle, HERO_TEXT, computedFont, heroTitle.offsetHeight / Math.max(1, Math.round(heroTitle.offsetHeight / parseFloat(getComputedStyle(heroTitle).lineHeight))))

  // Re-balance on resize
  const heroResizeObserver = new ResizeObserver(() => {
    heroTitle.style.maxWidth = ''
    requestAnimationFrame(() => {
      const cf = getComputedStyle(heroTitle).font
      const lh = parseFloat(getComputedStyle(heroTitle).lineHeight)
      balanceElement(heroTitle, HERO_TEXT, cf, lh)
    })
  })
  heroResizeObserver.observe(heroTitle.parentElement!)

  // --- Hero canvas background animation ---
  const heroCanvas = document.getElementById('hero-canvas') as HTMLCanvasElement
  const heroCtx = heroCanvas.getContext('2d')!
  const hero = document.getElementById('hero')!

  function sizeHeroCanvas() {
    const rect = hero.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    heroCanvas.width = rect.width * dpr
    heroCanvas.height = rect.height * dpr
    heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { width: rect.width, height: rect.height }
  }

  // Floating measurement lines animation
  interface FloatingLine {
    x: number
    y: number
    width: number
    opacity: number
    speed: number
    hue: number
  }

  const floatingLines: FloatingLine[] = Array.from({ length: 25 }, () => ({
    x: Math.random() * 800,
    y: Math.random() * 600,
    width: 40 + Math.random() * 200,
    opacity: 0.02 + Math.random() * 0.04,
    speed: 0.15 + Math.random() * 0.3,
    hue: 230 + Math.random() * 40,
  }))

  function animateHero(time: number) {
    const { width, height } = sizeHeroCanvas()
    heroCtx.clearRect(0, 0, width, height)

    for (const line of floatingLines) {
      line.y -= line.speed
      if (line.y < -20) {
        line.y = height + 20
        line.x = Math.random() * width
        line.width = 40 + Math.random() * 200
      }

      const pulse = Math.sin(time / 2000 + line.x * 0.01) * 0.5 + 0.5
      heroCtx.globalAlpha = line.opacity * (0.5 + pulse * 0.5)
      heroCtx.fillStyle = `hsl(${line.hue}, 60%, 70%)`

      // Draw a thin rounded line
      const radius = 1.5
      heroCtx.beginPath()
      heroCtx.roundRect(line.x, line.y, line.width, 3, radius)
      heroCtx.fill()
    }

    heroCtx.globalAlpha = 1
    requestAnimationFrame(animateHero)
  }
  requestAnimationFrame(animateHero)

  // --- Live measurement demo ---
  const demoContainer = document.getElementById('demo-texts')!

  demoPrepared.forEach((item, i) => {
    const card = document.createElement('div')
    card.style.cssText = `
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      background-image: var(--gradient-surface);
      transition: all 300ms ease;
    `

    const textEl = document.createElement('div')
    textEl.style.cssText = `font: 16px Inter; line-height: 24px; color: var(--color-text-secondary); margin-bottom: var(--space-2); word-wrap: break-word;`
    textEl.textContent = item.text

    const stats = document.createElement('div')
    stats.style.cssText = `font-family: var(--font-code); font-size: var(--text-xs); color: var(--color-text-tertiary); display: flex; gap: var(--space-3); flex-wrap: wrap;`
    stats.className = 'demo-stat'

    card.appendChild(textEl)
    card.appendChild(stats)
    demoContainer.appendChild(card)
  })

  function updateDemoStats() {
    const cards = demoContainer.children
    const containerWidth = demoContainer.clientWidth - 40 // padding

    for (let i = 0; i < demoPrepared.length; i++) {
      const item = demoPrepared[i]!
      const stats = cards[i]?.querySelector('.demo-stat') as HTMLElement
      if (!stats) continue

      const { result, elapsed } = timeExecution(() =>
        layout(item.prepared, containerWidth, 24)
      )

      stats.innerHTML = `
        <span>${result.lineCount} lines</span>
        <span>${result.height}px</span>
        <span style="color:var(--color-success)">${elapsed < 0.01 ? '<0.01' : elapsed.toFixed(3)}ms</span>
      `
    }
  }

  updateDemoStats()
  const resizeObserver = new ResizeObserver(() => updateDemoStats())
  resizeObserver.observe(demoContainer)

  // --- Hero perf counter ---
  const perfEl = document.getElementById('hero-perf')!

  function updateHeroPerf() {
    const width = 400

    // Batch: prepare + layout 500 texts
    const texts = Array.from({ length: 500 }, (_, i) => DEMO_PARAGRAPHS[i % DEMO_PARAGRAPHS.length]!)
    const prepared = texts.map(t => prepare(t, '16px Inter'))

    const { elapsed: layoutTime } = timeExecution(() => {
      for (const p of prepared) layout(p, width, 24)
    })

    perfEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <span style="font-family:var(--font-code);font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--color-success);font-variant-numeric:tabular-nums;">${layoutTime < 0.1 ? layoutTime.toFixed(2) : layoutTime.toFixed(1)}ms</span>
        <span style="font-size:var(--text-xs);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.05em;">500 layouts</span>
      </div>
      <div style="width:1px;height:36px;background:var(--color-border-bright);"></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <span style="font-family:var(--font-code);font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--color-accent);font-variant-numeric:tabular-nums;">0</span>
        <span style="font-size:var(--text-xs);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.05em;">DOM reads</span>
      </div>
      <div style="width:1px;height:36px;background:var(--color-border-bright);"></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <span style="font-family:var(--font-code);font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--color-accent);font-variant-numeric:tabular-nums;">15KB</span>
        <span style="font-size:var(--text-xs);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.05em;">zero deps</span>
      </div>
    `
  }

  updateHeroPerf()
}

init()
