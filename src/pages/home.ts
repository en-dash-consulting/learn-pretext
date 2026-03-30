import { prepare, layout } from '@chenglou/pretext'
import { waitForFonts, timeExecution } from '../shared/pretext-helpers'
import { tracks } from '../shared/nav-data'

const DEMO_TEXT = `Pretext measures and lays out multiline text without ever touching the DOM. It uses pure arithmetic over cached glyph widths — making resize-driven relayout essentially free. What once cost 30–40ms per frame now takes 0.09ms for 500 text blocks.`

async function init() {
  await waitForFonts()

  const content = document.getElementById('page-content')
  if (!content) return

  const prepared = prepare(DEMO_TEXT, '20px Inter')

  content.innerHTML = `
    <div class="hero">
      <h1 class="hero__title">Learn Pretext</h1>
      <p class="hero__tagline">Text layout at the speed of arithmetic</p>
      <div class="hero__demo" id="hero-demo">
        <div class="demo-area" id="hero-text-area" style="max-width:600px;margin:0 auto var(--space-6);text-align:left;">
          <p id="hero-text" style="font-size:20px;line-height:30px;margin:0">${DEMO_TEXT}</p>
        </div>
        <div id="hero-perf" class="perf-meter" style="margin:0 auto var(--space-8);justify-content:center"></div>
      </div>
      <a href="/pages/why-pretext.html" class="hero__cta">
        Start Learning &rarr;
      </a>
    </div>

    <div class="track-grid" style="padding:0 var(--space-6)">
      ${tracks.map(t => `
        <a href="${t.pages[0]!.href}" class="track-card">
          <div class="track-card__title">${t.title}</div>
          <div class="track-card__desc">${t.pages.length} ${t.pages.length === 1 ? 'page' : 'pages'}</div>
        </a>
      `).join('')}
    </div>
  `

  const perfEl = document.getElementById('hero-perf')!
  const textArea = document.getElementById('hero-text-area')!

  function measure() {
    const width = textArea.clientWidth - 48 // padding
    const { result, elapsed: pretextTime } = timeExecution(() =>
      layout(prepared, width, 30)
    )

    // DOM measurement for comparison
    const textEl = document.getElementById('hero-text')!
    const { elapsed: domTime } = timeExecution(() =>
      textEl.getBoundingClientRect()
    )

    perfEl.innerHTML = `
      <span class="perf-meter__item">
        <span class="perf-meter__label">pretext</span>
        <span class="perf-meter__value">${pretextTime < 0.01 ? '<0.01' : pretextTime.toFixed(2)}ms</span>
      </span>
      <span class="perf-meter__divider"></span>
      <span class="perf-meter__item">
        <span class="perf-meter__label">${result.lineCount} lines, ${result.height}px</span>
        <span class="perf-meter__value" style="color:var(--color-text-tertiary)"></span>
      </span>
      <span class="perf-meter__divider"></span>
      <span class="perf-meter__item">
        <span class="perf-meter__label">DOM</span>
        <span class="perf-meter__value perf-meter__value--slow">${domTime < 0.01 ? '<0.01' : domTime.toFixed(2)}ms</span>
      </span>
    `
  }

  measure()
  const observer = new ResizeObserver(() => measure())
  observer.observe(textArea)
}

init()
