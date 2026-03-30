import { tracks } from '../shared/nav-data'

interface SearchEntry {
  title: string
  track: string
  description: string
  keywords: string[]
  href: string
}

const searchIndex: SearchEntry[] = [
  { title: 'Home', track: 'Foundations', description: 'Introduction to pretext and the Learn Pretext site.', keywords: ['home', 'intro', 'overview', 'landing'], href: '/' },
  { title: 'Why Pretext', track: 'Foundations', description: 'The motivation behind pretext: fast text measurement without the DOM.', keywords: ['why', 'motivation', 'fast', 'measurement', 'dom', 'performance', 'canvas'], href: '/pages/why-pretext.html' },
  { title: 'Getting Started', track: 'Foundations', description: 'Install pretext, prepare text, and perform your first layout.', keywords: ['install', 'setup', 'npm', 'prepare', 'layout', 'quickstart', 'tutorial', 'beginner'], href: '/pages/getting-started.html' },
  { title: 'Accordion', track: 'Core Patterns', description: 'Animated accordion with smooth height transitions using pretext measurement.', keywords: ['accordion', 'expand', 'collapse', 'height', 'animation', 'transition', 'prepare', 'layout'], href: '/pages/accordion.html' },
  { title: 'Chat Bubbles', track: 'Core Patterns', description: 'Shrink-wrap chat bubbles to their text content using walkLineRanges.', keywords: ['chat', 'bubbles', 'shrink', 'wrap', 'walkLineRanges', 'width', 'messaging'], href: '/pages/bubbles.html' },
  { title: 'Masonry', track: 'Core Patterns', description: 'Masonry grid layout driven by pretext height measurements.', keywords: ['masonry', 'grid', 'columns', 'pinterest', 'layout', 'height', 'prepare', 'layout'], href: '/pages/masonry.html' },
  { title: 'Balanced Text', track: 'Core Patterns', description: 'Balance text across lines for more even typographic layouts.', keywords: ['balance', 'text', 'typography', 'lines', 'even', 'wrap', 'headline'], href: '/pages/balanced-text.html' },
  { title: 'The Pipeline', track: 'Core Patterns', description: 'Understanding the prepare-then-layout pipeline at the core of pretext.', keywords: ['pipeline', 'prepare', 'layout', 'two-step', 'architecture', 'core', 'api'], href: '/pages/pipeline.html' },
  { title: 'Rich API', track: 'Advanced', description: 'Using prepareWithSegments and layoutWithLines for rich text with mixed styles.', keywords: ['rich', 'segments', 'prepareWithSegments', 'layoutWithLines', 'mixed', 'styles', 'bold', 'italic'], href: '/pages/rich-api.html' },
  { title: 'Editorial Layout', track: 'Advanced', description: 'Magazine-style editorial layouts with text flowing around obstacles.', keywords: ['editorial', 'magazine', 'float', 'obstacle', 'text-wrap', 'layoutNextLine', 'flow'], href: '/pages/editorial.html' },
  { title: 'Virtualized Lists', track: 'Advanced', description: 'High-performance virtualized scrolling with pretext-measured row heights.', keywords: ['virtual', 'scroll', 'list', 'virtualized', 'performance', 'height', 'row', 'windowing'], href: '/pages/virtualized.html' },
  { title: 'Canvas Rendering', track: 'Advanced', description: 'Render text on HTML canvas using pretext for measurement and line breaking.', keywords: ['canvas', 'render', 'draw', 'fillText', '2d', 'context', 'painting'], href: '/pages/canvas.html' },
  { title: 'i18n Deep Dive', track: 'Advanced', description: 'Internationalization: CJK text, RTL scripts, and setLocale for locale-aware breaking.', keywords: ['i18n', 'internationalization', 'cjk', 'rtl', 'locale', 'setLocale', 'unicode', 'chinese', 'japanese', 'korean', 'arabic', 'hebrew'], href: '/pages/i18n.html' },
  { title: 'Kinetic Typography', track: 'Creative', description: 'Animated kinetic text effects powered by pretext line data.', keywords: ['kinetic', 'typography', 'animation', 'motion', 'creative', 'effect', 'text'], href: '/pages/kinetic.html' },
  { title: 'ASCII Art', track: 'Creative', description: 'Generate ASCII art layouts using pretext measurement for monospace text.', keywords: ['ascii', 'art', 'monospace', 'creative', 'characters', 'text-art'], href: '/pages/ascii-art.html' },
  { title: 'Text Physics', track: 'Creative', description: 'Physics playground: characters with gravity, collision, and accelerometer support.', keywords: ['physics', 'gravity', 'collision', 'accelerometer', 'gyroscope', 'verlet', 'particles', 'interactive', 'game'], href: '/pages/text-physics.html' },
  { title: 'ASCII Tanks', track: 'Creative', description: 'Turn-based artillery game with destructible ASCII terrain and projectile physics.', keywords: ['tanks', 'game', 'artillery', 'terrain', 'destruction', 'ascii', 'multiplayer', 'projectile', 'explosion'], href: '/pages/ascii-tanks.html' },
  { title: 'Text Rain', track: 'Creative', description: 'Catch falling characters on a platform to reconstruct text. Interactive installation.', keywords: ['rain', 'falling', 'catch', 'platform', 'interactive', 'installation', 'game', 'characters'], href: '/pages/text-rain.html' },
  { title: 'Text Tetris', track: 'Creative', description: 'Tetris with text blocks. Rotating changes width, which reflows text and changes the block shape.', keywords: ['tetris', 'game', 'blocks', 'rotate', 'reflow', 'stacking', 'width', 'height', 'puzzle'], href: '/pages/text-tetris.html' },
  { title: 'API Reference', track: 'Reference', description: 'Complete API reference: prepare, layout, prepareWithSegments, layoutWithLines, walkLineRanges, layoutNextLine, clearCache, setLocale.', keywords: ['api', 'reference', 'docs', 'prepare', 'layout', 'prepareWithSegments', 'layoutWithLines', 'walkLineRanges', 'layoutNextLine', 'clearCache', 'setLocale'], href: '/pages/api-reference.html' },
  { title: 'Performance Guide', track: 'Reference', description: 'Benchmarks, caching strategies, and optimization tips for pretext.', keywords: ['performance', 'benchmark', 'speed', 'cache', 'clearCache', 'optimization', 'fast'], href: '/pages/performance.html' },
  { title: 'Caveats & Recipes', track: 'Reference', description: 'Known limitations, font gotchas, and ready-to-use code recipes.', keywords: ['caveats', 'recipes', 'gotchas', 'font', 'limitations', 'system-ui', 'resize', 'react', 'virtual-scroll'], href: '/pages/caveats.html' },
  { title: 'Accessibility', track: 'Reference', description: 'Accessibility considerations when using pretext: screen readers, ARIA, canvas mirrors, reduced motion.', keywords: ['accessibility', 'a11y', 'aria', 'screen-reader', 'wcag', 'contrast', 'canvas', 'virtualized', 'reduced-motion', 'keyboard'], href: '/pages/accessibility.html' },
  { title: 'About This Site', track: 'Reference', description: 'About Learn Pretext, the pretext library, and how this site was built.', keywords: ['about', 'credits', 'license', 'en-dash', 'cheng-lou'], href: '/pages/about.html' },
]

function fuzzyMatch(query: string, text: string): { matches: boolean; score: number; ranges: [number, number][] } {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  const ranges: [number, number][] = []

  // Exact substring match (highest priority)
  const exactIdx = lowerText.indexOf(lowerQuery)
  if (exactIdx !== -1) {
    return { matches: true, score: 100 + (1 / (exactIdx + 1)), ranges: [[exactIdx, exactIdx + query.length]] }
  }

  // Word-start matching: each query token matches the start of a word
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean)
  if (queryTokens.length > 1) {
    let allFound = true
    const wordRanges: [number, number][] = []
    for (const token of queryTokens) {
      const idx = lowerText.indexOf(token)
      if (idx === -1) { allFound = false; break }
      wordRanges.push([idx, idx + token.length])
    }
    if (allFound) {
      return { matches: true, score: 80, ranges: wordRanges }
    }
  }

  // Character-by-character fuzzy match
  let qi = 0
  let score = 0
  let lastMatchIdx = -2
  let currentRangeStart = -1
  let currentRangeEnd = -1

  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) {
      if (ti === lastMatchIdx + 1) {
        score += 3 // consecutive bonus
        currentRangeEnd = ti + 1
      } else {
        if (currentRangeStart !== -1) {
          ranges.push([currentRangeStart, currentRangeEnd])
        }
        currentRangeStart = ti
        currentRangeEnd = ti + 1
        score += 1
      }
      // Word boundary bonus
      if (ti === 0 || lowerText[ti - 1] === ' ' || lowerText[ti - 1] === '-' || lowerText[ti - 1] === '_') {
        score += 2
      }
      lastMatchIdx = ti
      qi++
    }
  }

  if (currentRangeStart !== -1) {
    ranges.push([currentRangeStart, currentRangeEnd])
  }

  const matched = qi === lowerQuery.length
  return { matches: matched, score: matched ? score : 0, ranges }
}

function highlightText(text: string, ranges: [number, number][]): string {
  if (ranges.length === 0) return escapeHtml(text)

  // Sort ranges by start position
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  let result = ''
  let lastIdx = 0

  for (const [start, end] of sorted) {
    if (start > lastIdx) {
      result += escapeHtml(text.slice(lastIdx, start))
    }
    result += `<mark class="search__highlight">${escapeHtml(text.slice(start, end))}</mark>`
    lastIdx = end
  }
  if (lastIdx < text.length) {
    result += escapeHtml(text.slice(lastIdx))
  }
  return result
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface SearchResult {
  entry: SearchEntry
  score: number
  titleRanges: [number, number][]
  descriptionRanges: [number, number][]
}

function search(query: string): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []

  for (const entry of searchIndex) {
    const titleMatch = fuzzyMatch(query, entry.title)
    const descMatch = fuzzyMatch(query, entry.description)
    const trackMatch = fuzzyMatch(query, entry.track)
    const keywordScores = entry.keywords.map(k => fuzzyMatch(query, k))
    const bestKeyword = keywordScores.reduce((best, m) => m.score > best.score ? m : best, { matches: false, score: 0, ranges: [] as [number, number][] })

    const totalScore = (titleMatch.matches ? titleMatch.score * 3 : 0)
      + (descMatch.matches ? descMatch.score * 1.5 : 0)
      + (trackMatch.matches ? trackMatch.score * 1 : 0)
      + (bestKeyword.matches ? bestKeyword.score * 2 : 0)

    if (totalScore > 0) {
      results.push({
        entry,
        score: totalScore,
        titleRanges: titleMatch.ranges,
        descriptionRanges: descMatch.ranges,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 10)
}

let modal: HTMLElement | null = null
let activeIndex = 0
let currentResults: SearchResult[] = []
let isOpen = false

function createModal(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'search-modal'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.setAttribute('aria-label', 'Site search')
  el.innerHTML = `
    <div class="search-modal__backdrop"></div>
    <div class="search-modal__panel">
      <div class="search-modal__input-wrapper">
        <svg class="search-modal__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-modal__input"
          type="text"
          placeholder="Search pages, topics, APIs..."
          aria-label="Search"
          autocomplete="off"
          spellcheck="false"
        />
        <kbd class="search-modal__kbd">esc</kbd>
      </div>
      <div class="search-modal__results" role="listbox" aria-label="Search results"></div>
      <div class="search-modal__footer">
        <span class="search-modal__hint"><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
        <span class="search-modal__hint"><kbd>&crarr;</kbd> open</span>
        <span class="search-modal__hint"><kbd>esc</kbd> close</span>
      </div>
    </div>
  `

  const backdrop = el.querySelector('.search-modal__backdrop')!
  const input = el.querySelector('.search-modal__input') as HTMLInputElement
  const resultsContainer = el.querySelector('.search-modal__results')!

  backdrop.addEventListener('click', closeSearch)

  input.addEventListener('input', () => {
    const query = input.value
    currentResults = search(query)
    activeIndex = 0
    renderResults(resultsContainer, currentResults)
  })

  input.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent
    if (ev.key === 'ArrowDown') {
      ev.preventDefault()
      if (currentResults.length > 0) {
        activeIndex = (activeIndex + 1) % currentResults.length
        renderResults(resultsContainer, currentResults)
      }
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault()
      if (currentResults.length > 0) {
        activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length
        renderResults(resultsContainer, currentResults)
      }
    } else if (ev.key === 'Enter') {
      ev.preventDefault()
      if (currentResults.length > 0 && currentResults[activeIndex]) {
        window.location.href = currentResults[activeIndex]!.entry.href
      }
    } else if (ev.key === 'Escape') {
      ev.preventDefault()
      closeSearch()
    }
  })

  return el
}

function renderResults(container: Element, results: SearchResult[]) {
  if (results.length === 0) {
    const input = modal?.querySelector('.search-modal__input') as HTMLInputElement | null
    const query = input?.value ?? ''
    if (query.trim()) {
      container.innerHTML = `<div class="search-modal__empty">No results for "${escapeHtml(query)}"</div>`
    } else {
      container.innerHTML = `<div class="search-modal__empty search-modal__empty--hint">Start typing to search across all pages</div>`
    }
    return
  }

  container.innerHTML = results.map((r, i) => `
    <a
      href="${r.entry.href}"
      class="search-modal__result${i === activeIndex ? ' search-modal__result--active' : ''}"
      role="option"
      aria-selected="${i === activeIndex}"
    >
      <div class="search-modal__result-title">${highlightText(r.entry.title, r.titleRanges)}</div>
      <div class="search-modal__result-meta">
        <span class="search-modal__result-track">${escapeHtml(r.entry.track)}</span>
        <span class="search-modal__result-desc">${highlightText(r.entry.description, r.descriptionRanges)}</span>
      </div>
    </a>
  `).join('')

  // Scroll active result into view
  const activeEl = container.querySelector('.search-modal__result--active')
  activeEl?.scrollIntoView({ block: 'nearest' })
}

export function openSearch() {
  if (isOpen) return
  isOpen = true

  if (!modal) {
    modal = createModal()
  }

  document.body.appendChild(modal)
  // Force reflow then add visible class for animation
  void modal.offsetHeight
  modal.classList.add('search-modal--visible')

  const input = modal.querySelector('.search-modal__input') as HTMLInputElement
  input.value = ''
  currentResults = []
  activeIndex = 0
  renderResults(modal.querySelector('.search-modal__results')!, [])

  requestAnimationFrame(() => input.focus())
}

export function closeSearch() {
  if (!isOpen || !modal) return
  isOpen = false

  modal.classList.remove('search-modal--visible')
  modal.addEventListener('transitionend', function handler() {
    modal?.removeEventListener('transitionend', handler)
    modal?.remove()
  }, { once: true })

  // Fallback if transitionend doesn't fire
  setTimeout(() => {
    if (!isOpen && modal?.parentElement) {
      modal.remove()
    }
  }, 300)
}

export function initSearch() {
  // Global keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      if (isOpen) {
        closeSearch()
      } else {
        openSearch()
      }
    }
  })
}

export function createSearchButton(): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const shortcut = isMac ? '&#8984;K' : 'Ctrl+K'
  return `
    <button class="header__search" id="search-trigger" aria-label="Search (${isMac ? 'Cmd' : 'Ctrl'}+K)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span class="header__search-text">Search</span>
      <kbd class="header__search-kbd">${shortcut}</kbd>
    </button>
  `
}
