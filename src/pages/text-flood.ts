import { prepare, layout } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const LEVELS = [
  {
    text: 'Typography is the art and technique of arranging type to make written language legible readable and appealing when displayed. The arrangement of type involves selecting typefaces point sizes line lengths and letter spacing.',
    containerWidth: 320,
    targetHeight: 120,
    par: 3,
  },
  {
    text: 'Pretext measures multiline text without ever touching the DOM. It uses pure arithmetic over cached glyph widths to compute line counts and heights. This makes resize driven relayout essentially free compared to traditional browser measurement approaches.',
    containerWidth: 280,
    targetHeight: 144,
    par: 4,
  },
  {
    text: 'The quick brown fox jumps over the lazy dog. Sphinx of black quartz judge my vow. We promptly judged antique ivory buckles for the next prize. Crazy Frederick bought many very exquisite opal jewels. Waltz nymph for quick jigs vex bud.',
    containerWidth: 250,
    targetHeight: 168,
    par: 5,
  },
  {
    text: 'Web developers have struggled with text measurement for decades. Every call to getBoundingClientRect forces the browser to recalculate layout. When you measure hundreds of elements this creates layout thrashing that destroys performance. The solution is to measure text with pure math bypassing the DOM entirely.',
    containerWidth: 300,
    targetHeight: 144,
    par: 4,
  },
  {
    text: 'Creating beautiful editorial layouts on the web has always been limited by the browser layout engine. Text cannot flow around arbitrary shapes and predicting how much space text will occupy requires rendering it first. With pretext these constraints disappear because layout computation is instant and independent of the DOM.',
    containerWidth: 260,
    targetHeight: 168,
    par: 6,
  },
]

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Word Golf</h1>
      <p class="content__subtitle">Remove the fewest words to fit the text under the target height. Pretext's <span class="api-tag">layout()</span> gives instant feedback after every removal.</p>
    </div>

    <div class="content__section">
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-6);align-items:start;">
        <div style="flex:1;min-width:280px;">
          <div style="display:flex;gap:var(--space-3);align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap;">
            <div id="level-selector" style="display:flex;gap:var(--space-2);"></div>
            <button id="reset-btn" style="padding:var(--space-1) var(--space-3);background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);color:var(--color-text-secondary);cursor:pointer;font-size:var(--text-sm);">Reset</button>
          </div>

          <div id="game-info" style="display:flex;gap:var(--space-6);margin-bottom:var(--space-4);font-family:var(--font-code);font-size:var(--text-sm);flex-wrap:wrap;"></div>

          <div style="position:relative;display:inline-block;" id="game-wrapper">
            <div class="demo-area" style="position:relative;padding:0;overflow:hidden;" id="game-area">
              <div id="text-container" style="padding:var(--space-4);position:relative;font:${FONT};line-height:${LINE_HEIGHT}px;word-wrap:break-word;cursor:pointer;user-select:none;"></div>
              <div id="target-line" style="position:absolute;left:0;right:0;height:2px;background:var(--color-error);opacity:0.5;pointer-events:none;z-index:1;"></div>
            </div>
            <div id="height-bar" style="position:absolute;top:0;right:-12px;width:6px;border-radius:3px;background:var(--color-error);transition:height 200ms ease;"></div>
          </div>

          <div id="result-area" style="margin-top:var(--space-4);min-height:48px;max-width:400px;"></div>
        </div>

        <div style="width:200px;flex-shrink:0;">
          <div style="background:var(--color-bg-raised);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-4);font-size:var(--text-sm);">
            <div style="font-weight:var(--font-weight-semibold);color:var(--color-text);margin-bottom:var(--space-3);">How to play</div>
            <div style="color:var(--color-text-tertiary);display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-xs);line-height:1.5;">
              <p>Click words to remove them.</p>
              <p>Get the text height under the red target line.</p>
              <p>Fewer removals = better score.</p>
              <p style="color:var(--color-accent);">Pretext recalculates height instantly after each removal.</p>
            </div>
          </div>
          <div id="layout-stats" style="margin-top:var(--space-3);font-family:var(--font-code);font-size:var(--text-xs);color:var(--color-text-tertiary);line-height:1.6;"></div>
        </div>
      </div>
      <div id="golf-source" style="margin-top:var(--space-8);max-width:var(--content-wide-max-width);"></div>
    </div>
  `

  const textContainer = document.getElementById('text-container')!
  const targetLine = document.getElementById('target-line')!
  const heightBar = document.getElementById('height-bar')!
  const gameInfo = document.getElementById('game-info')!
  const resultArea = document.getElementById('result-area')!
  const layoutStats = document.getElementById('layout-stats')!
  const levelSelector = document.getElementById('level-selector')!
  const resetBtn = document.getElementById('reset-btn')!
  const gameArea = document.getElementById('game-area')!

  let currentLevel = 0
  let words: string[] = []
  let removed: Set<number> = new Set()
  let layoutCalls = 0
  let totalLayoutTime = 0
  let solved = false

  LEVELS.forEach((_, i) => {
    const btn = document.createElement('button')
    btn.style.cssText = `width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${i === 0 ? 'var(--color-accent)' : 'var(--color-bg-surface)'};color:${i === 0 ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'};border:1px solid var(--color-border);border-radius:var(--radius-sm);cursor:pointer;font-size:var(--text-sm);font-weight:var(--font-weight-semibold);`
    btn.textContent = `${i + 1}`
    btn.addEventListener('click', () => {
      currentLevel = i
      levelSelector.querySelectorAll('button').forEach((b, j) => {
        ;(b as HTMLElement).style.background = j === i ? 'var(--color-accent)' : 'var(--color-bg-surface)'
        ;(b as HTMLElement).style.color = j === i ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'
      })
      loadLevel()
    })
    levelSelector.appendChild(btn)
  })

  resetBtn.addEventListener('click', loadLevel)

  function loadLevel() {
    const level = LEVELS[currentLevel]!
    words = level.text.split(' ')
    removed = new Set()
    layoutCalls = 0
    totalLayoutTime = 0
    solved = false
    resultArea.innerHTML = ''
    gameArea.style.width = `${level.containerWidth + 32}px`
    renderWords()
  }

  function getCurrentText(): string {
    return words.filter((_, i) => !removed.has(i)).join(' ')
  }

  function measureHeight(text: string, width: number): { height: number; lineCount: number; elapsed: number } {
    const { result, elapsed } = timeExecution(() => {
      const prepared = prepare(text, FONT)
      return layout(prepared, width, LINE_HEIGHT)
    })
    layoutCalls++
    totalLayoutTime += elapsed
    return { height: result.height, lineCount: result.lineCount, elapsed }
  }

  function renderWords() {
    const level = LEVELS[currentLevel]!
    const text = getCurrentText()
    const contentWidth = level.containerWidth
    const { height, lineCount, elapsed } = measureHeight(text, contentWidth)

    textContainer.innerHTML = ''
    const remainingIndices = words.map((_, idx) => idx).filter(idx => !removed.has(idx))

    words.forEach((word, i) => {
      if (removed.has(i)) return

      const span = document.createElement('span')
      span.textContent = word
      span.style.cssText = `cursor:pointer;padding:1px 2px;border-radius:3px;transition:all 120ms ease;`

      if (!solved) {
        span.addEventListener('mouseenter', () => {
          span.style.background = 'rgba(251,113,133,0.15)'
          span.style.color = 'var(--color-error)'
          span.style.textDecoration = 'line-through'
        })
        span.addEventListener('mouseleave', () => {
          span.style.background = ''
          span.style.color = ''
          span.style.textDecoration = ''
        })
        span.addEventListener('click', () => {
          removed.add(i)
          renderWords()
        })
      }

      textContainer.appendChild(span)

      if (i !== remainingIndices[remainingIndices.length - 1]) {
        textContainer.appendChild(document.createTextNode(' '))
      }
    })

    // Target line position (relative to game area)
    targetLine.style.top = `${level.targetHeight + 16}px`

    // Height bar
    const maxBarHeight = level.targetHeight + 100
    const barHeight = Math.min(height, maxBarHeight)
    heightBar.style.height = `${barHeight + 32}px`
    heightBar.style.background = height <= level.targetHeight ? 'var(--color-success)' : 'var(--color-error)'

    const removedCount = removed.size
    const overUnder = height - level.targetHeight
    gameInfo.innerHTML = `
      <span>Height: <span style="color:${height <= level.targetHeight ? 'var(--color-success)' : 'var(--color-error)'};">${height}px</span> / ${level.targetHeight}px</span>
      <span>Lines: <span style="color:var(--color-accent);">${lineCount}</span></span>
      <span>Removed: <span style="color:${removedCount <= level.par ? 'var(--color-success)' : 'var(--color-warning)'};">${removedCount}</span> (par ${level.par})</span>
    `

    const avg = layoutCalls > 0 ? totalLayoutTime / layoutCalls : 0
    layoutStats.innerHTML = `
      layout() calls: ${layoutCalls}<br>
      avg: ${avg.toFixed(3)}ms<br>
      last: ${elapsed.toFixed(3)}ms<br>
      total: ${totalLayoutTime.toFixed(1)}ms
    `

    if (height <= level.targetHeight && !solved) {
      solved = true
      const underPar = level.par - removedCount
      const scoreName = underPar > 1 ? 'Eagle' : underPar === 1 ? 'Birdie' : underPar === 0 ? 'Par' : underPar === -1 ? 'Bogey' : 'Double Bogey'
      const scoreColor = underPar >= 0 ? 'var(--color-success)' : 'var(--color-warning)'
      const scoreDesc = underPar > 0 ? `${underPar} under par` : underPar === 0 ? 'Even par' : `${Math.abs(underPar)} over par`

      resultArea.innerHTML = `
        <div style="padding:var(--space-4);background:var(--gradient-accent-soft);border:1px solid rgba(129,140,248,0.15);border-radius:var(--radius-md);">
          <div style="font-size:var(--text-xl);font-weight:var(--font-weight-bold);color:${scoreColor};margin-bottom:var(--space-1);">${scoreName}!</div>
          <div style="font-size:var(--text-sm);color:var(--color-text-secondary);">${removedCount} words removed &middot; ${scoreDesc}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-2);">Pretext computed height ${layoutCalls} times in ${totalLayoutTime.toFixed(1)}ms total</div>
          ${currentLevel < LEVELS.length - 1 ? `<button id="next-level-btn" style="margin-top:var(--space-3);padding:var(--space-2) var(--space-4);background:var(--gradient-accent);color:var(--color-text-inverse);border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:600;font-size:var(--text-sm);">Next Level &rarr;</button>` : '<div style="margin-top:var(--space-2);font-size:var(--text-sm);color:var(--color-success);">All levels complete!</div>'}
        </div>
      `

      document.getElementById('next-level-btn')?.addEventListener('click', () => {
        currentLevel++
        levelSelector.querySelectorAll('button').forEach((b, j) => {
          ;(b as HTMLElement).style.background = j === currentLevel ? 'var(--color-accent)' : 'var(--color-bg-surface)'
          ;(b as HTMLElement).style.color = j === currentLevel ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'
        })
        loadLevel()
      })
    }
  }

  loadLevel()

  const sourceCode = `import { prepare, layout } from '@chenglou/pretext'

// Instant height feedback after each word removal
function getTextHeight(text: string, width: number): number {
  const prepared = prepare(text, '16px Inter')
  const { height } = layout(prepared, width, 24)
  return height  // ~0.01ms — the game depends on this being instant
}

// On every click (word removal):
removed.add(wordIndex)
const text = words.filter((_, i) => !removed.has(i)).join(' ')
const height = getTextHeight(text, containerWidth)

if (height <= targetHeight) {
  // Win! Score = removed.size vs par
}

// Without pretext, each removal would need:
// 1. Render text in a hidden DOM element
// 2. Read offsetHeight (forces reflow)
// 3. ~1-5ms per measurement
// With pretext: ~0.01ms per measurement`

  await createSourceViewer(document.getElementById('golf-source')!, {
    code: sourceCode,
    title: 'Word Golf — Pretext Integration',
  })
}

init()
