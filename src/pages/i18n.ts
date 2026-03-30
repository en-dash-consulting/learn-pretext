import { prepareWithSegments, layoutWithLines, setLocale } from '@chenglou/pretext'
import { waitForFonts, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createSlider } from '../components/slider'
import { createPerfMeter } from '../components/performance-meter'

interface LanguageSample {
  name: string
  locale: string
  font: string
  text: string
}

const LANGUAGES: LanguageSample[] = [
  {
    name: 'English',
    locale: 'en',
    font: '16px Inter',
    text: 'The quick brown fox jumps over the lazy dog. Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.',
  },
  {
    name: 'Chinese',
    locale: 'zh',
    font: '16px system-ui',
    text: '\u6392\u7248\u662F\u5C06\u6587\u5B57\u3001\u56FE\u7247\u3001\u56FE\u5F62\u6216\u5176\u4ED6\u4FE1\u606F\u5143\u7D20\u6392\u5217\u7EC4\u5408\u7684\u8FC7\u7A0B\u3002\u6392\u7248\u8BBE\u8BA1\u5305\u62EC\u5B57\u4F53\u9009\u62E9\u3001\u5B57\u53F7\u3001\u884C\u8DDD\u3001\u5B57\u8DDD\u4EE5\u53CA\u6574\u4F53\u5E03\u5C40\u3002\u597D\u7684\u6392\u7248\u53EF\u4EE5\u8BA9\u8BFB\u8005\u66F4\u5BB9\u6613\u7406\u89E3\u5185\u5BB9\u3002',
  },
  {
    name: 'Japanese',
    locale: 'ja',
    font: '16px system-ui',
    text: '\u30BF\u30A4\u30DD\u30B0\u30E9\u30D5\u30A3\u306F\u3001\u6D3B\u5B57\u3092\u7D44\u307F\u5408\u308F\u305B\u3066\u66F8\u304B\u308C\u305F\u8A00\u8449\u3092\u8AAD\u307F\u3084\u3059\u304F\u3001\u7F8E\u3057\u304F\u8868\u793A\u3059\u308B\u6280\u8853\u3067\u3059\u3002\u66F8\u4F53\u306E\u9078\u629E\u3001\u30DD\u30A4\u30F3\u30C8\u30B5\u30A4\u30BA\u3001\u884C\u9577\u3001\u884C\u9593\u3001\u5B57\u9593\u306E\u8ABF\u6574\u304C\u542B\u307E\u308C\u307E\u3059\u3002',
  },
  {
    name: 'Arabic',
    locale: 'ar',
    font: '16px system-ui',
    text: '\u0627\u0644\u0637\u0628\u0627\u0639\u0629 \u0647\u064A \u0641\u0646 \u0648\u062A\u0642\u0646\u064A\u0629 \u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u062D\u0631\u0648\u0641 \u0644\u062C\u0639\u0644 \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0645\u0643\u062A\u0648\u0628\u0629 \u0645\u0642\u0631\u0648\u0621\u0629 \u0648\u062C\u0630\u0627\u0628\u0629 \u0639\u0646\u062F \u0639\u0631\u0636\u0647\u0627. \u064A\u062A\u0636\u0645\u0646 \u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062E\u0637\u0648\u0637 \u0648\u0627\u0644\u0623\u062D\u062C\u0627\u0645 \u0648\u0627\u0644\u0645\u0633\u0627\u0641\u0627\u062A.',
  },
  {
    name: 'Thai',
    locale: 'th',
    font: '16px system-ui',
    text: '\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E37\u0E2D\u0E28\u0E34\u0E25\u0E1B\u0E30\u0E41\u0E25\u0E30\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E20\u0E32\u0E29\u0E32\u0E40\u0E02\u0E35\u0E22\u0E19\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E07\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E2A\u0E27\u0E22\u0E07\u0E32\u0E21 \u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E23\u0E27\u0E21\u0E16\u0E36\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E2D\u0E31\u0E01\u0E29\u0E23\u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23',
  },
  {
    name: 'Hindi',
    locale: 'hi',
    font: '16px system-ui',
    text: '\u091F\u093E\u0907\u092A\u094B\u0917\u094D\u0930\u093E\u092B\u0940 \u0932\u093F\u0916\u093F\u0924 \u092D\u093E\u0937\u093E \u0915\u094B \u0938\u0941\u092A\u093E\u0920\u094D\u092F, \u092A\u0920\u0928\u0940\u092F \u0914\u0930 \u0906\u0915\u0930\u094D\u0937\u0915 \u092C\u0928\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u091F\u093E\u0907\u092A \u0915\u094B \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093F\u0924 \u0915\u0930\u0928\u0947 \u0915\u0940 \u0915\u0932\u093E \u0914\u0930 \u0924\u0915\u0928\u0940\u0915 \u0939\u0948\u0964 \u0907\u0938\u092E\u0947\u0902 \u091F\u093E\u0907\u092A\u092B\u0947\u0938 \u091A\u0941\u0928\u0928\u093E, \u092C\u093F\u0902\u0926\u0941 \u0906\u0915\u093E\u0930, \u092A\u0902\u0915\u094D\u0924\u093F \u0932\u0902\u092C\u093E\u0908 \u0914\u0930 \u0905\u0915\u094D\u0937\u0930 \u0905\u0902\u0924\u0930\u093E\u0932 \u0936\u093E\u092E\u093F\u0932 \u0939\u0948\u0902\u0964',
  },
  {
    name: 'Emoji',
    locale: 'en',
    font: '16px system-ui',
    text: '\uD83D\uDE80 \uD83C\uDF1F \uD83C\uDF08 \uD83C\uDF3B \uD83C\uDF0D \uD83D\uDCDA \u2728 \uD83C\uDFA8 \uD83D\uDCA1 \uD83D\uDD25 \uD83C\uDFAF \uD83E\uDD16 Hello world! \uD83D\uDC4B This is a mix of emoji \uD83C\uDF89 and regular text \uD83D\uDCDD that should wrap correctly \u2705 at any width \uD83D\uDCCF you choose \uD83D\uDC49\uD83D\uDC48',
  },
]

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">i18n Deep Dive</h1>
      <p class="content__subtitle">See how pretext handles different writing systems with <span class="api-tag">setLocale()</span> and <span class="api-tag">prepareWithSegments()</span>.</p>
    </div>

    <div class="content__section">
      <h2>Language Samples</h2>
      <p>Select a language to see its text segmented and laid out by pretext. Use the width slider to observe how different scripts break differently.</p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin:var(--space-4) 0" id="lang-selector"></div>
      <div id="width-slider" style="margin-bottom:var(--space-4)"></div>
      <div id="i18n-perf" style="margin-bottom:var(--space-4)"></div>
    </div>

    <div class="content__section" id="display-section">
      <h3 id="lang-title"></h3>

      <h4 style="margin-top:var(--space-4);margin-bottom:var(--space-2);font-size:var(--text-sm);color:var(--color-text-tertiary)">Rendered Text</h4>
      <div class="demo-area" id="text-render"></div>

      <h4 style="margin-top:var(--space-4);margin-bottom:var(--space-2);font-size:var(--text-sm);color:var(--color-text-tertiary)">Segments</h4>
      <div class="demo-area" id="segments-display" style="overflow-x:auto"></div>

      <h4 style="margin-top:var(--space-4);margin-bottom:var(--space-2);font-size:var(--text-sm);color:var(--color-text-tertiary)">Layout Result</h4>
      <div class="demo-area" id="layout-display"></div>
    </div>

    <div class="content__section">
      <h2>Custom Text</h2>
      <p>Paste any text to see how pretext segments and lays it out.</p>
      <textarea id="custom-input" rows="3" placeholder="Paste text in any language..." style="width:100%;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-3);color:var(--color-text);font:var(--text-base) var(--font-body);resize:vertical;margin-bottom:var(--space-3)"></textarea>
      <div class="demo-area" id="custom-display"></div>
    </div>

    <div id="i18n-source" style="margin-top:var(--space-8)"></div>
  `

  let selectedLang = 0
  let maxWidth = 400

  const perfMeter = createPerfMeter(document.getElementById('i18n-perf')!)
  const KIND_COLORS: Record<string, string> = {
    'text': '#6e9eff',
    'space': '#666',
    'glue': '#fbbf24',
    'soft-hyphen': '#f87171',
    'hard-break': '#4ade80',
  }

  // Language selector
  const selectorEl = document.getElementById('lang-selector')!
  LANGUAGES.forEach((lang, i) => {
    const btn = document.createElement('button')
    btn.style.cssText = `padding:var(--space-1) var(--space-3);background:${i === 0 ? 'var(--color-accent)' : 'var(--color-bg-surface)'};color:${i === 0 ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'};border:1px solid var(--color-border);border-radius:var(--radius-sm);cursor:pointer;font-size:var(--text-sm);`
    btn.textContent = lang.name
    btn.addEventListener('click', () => {
      selectedLang = i
      selectorEl.querySelectorAll('button').forEach((b, j) => {
        ;(b as HTMLElement).style.background = j === i ? 'var(--color-accent)' : 'var(--color-bg-surface)'
        ;(b as HTMLElement).style.color = j === i ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)'
      })
      update()
    })
    selectorEl.appendChild(btn)
  })

  createSlider(document.getElementById('width-slider')!, {
    label: 'Max Width',
    min: 150,
    max: 700,
    value: 400,
    step: 10,
    formatValue: v => `${v}px`,
    onChange: v => {
      maxWidth = v
      update()
    },
  })

  function displaySegments(container: HTMLElement, prepared: ReturnType<typeof prepareWithSegments>) {
    container.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;align-items:flex-start;'

    prepared.segments.forEach((seg, i) => {
      const kind = prepared.kinds[i] ?? 'text'
      const color = KIND_COLORS[kind] ?? '#6e9eff'
      const width = prepared.widths[i] ?? 0

      const chip = document.createElement('div')
      chip.style.cssText = `display:inline-flex;flex-direction:column;align-items:center;border:1px solid ${color}40;border-radius:3px;padding:2px 4px;background:${color}10;font-family:var(--font-code);font-size:var(--text-xs);`

      const text = document.createElement('span')
      text.style.cssText = `color:${color};white-space:pre;`
      text.textContent = seg === ' ' ? '\u2423' : seg

      const info = document.createElement('span')
      info.style.cssText = `font-size:9px;color:var(--color-text-tertiary);`
      info.textContent = `${kind} ${width.toFixed(1)}px`

      chip.appendChild(text)
      chip.appendChild(info)
      wrap.appendChild(chip)
    })

    container.appendChild(wrap)
  }

  function update() {
    const lang = LANGUAGES[selectedLang]!
    document.getElementById('lang-title')!.textContent = `${lang.name} (${lang.locale})`

    // Set locale
    setLocale(lang.locale)

    const { result: prepared, elapsed: prepareTime } = timeExecution(() =>
      prepareWithSegments(lang.text, lang.font)
    )

    const { result: linesResult, elapsed: layoutTime } = timeExecution(() =>
      layoutWithLines(prepared, maxWidth, LINE_HEIGHT)
    )

    perfMeter.update([
      { label: 'prepare()', value: prepareTime },
      { label: 'layoutWithLines()', value: layoutTime },
      { label: `${prepared.segments.length} segments`, value: linesResult.lineCount },
    ])

    // Rendered text
    const renderEl = document.getElementById('text-render')!
    renderEl.innerHTML = ''
    const textDiv = document.createElement('div')
    textDiv.style.cssText = `font:${lang.font};line-height:${LINE_HEIGHT}px;max-width:${maxWidth}px;word-wrap:break-word;`
    textDiv.textContent = lang.text
    renderEl.appendChild(textDiv)

    // Segments
    displaySegments(document.getElementById('segments-display')!, prepared)

    // Layout result
    const layoutEl = document.getElementById('layout-display')!
    layoutEl.innerHTML = `
      <div style="font-family:var(--font-code);font-size:var(--text-sm);margin-bottom:var(--space-3)">
        <span style="color:var(--color-text-tertiary)">lineCount:</span> <span style="color:var(--color-accent)">${linesResult.lineCount}</span>
        <span style="color:var(--color-text-tertiary);margin-left:var(--space-3)">height:</span> <span style="color:var(--color-accent)">${linesResult.height}px</span>
      </div>
      ${linesResult.lines.map((line, i) => `
        <div style="display:flex;gap:var(--space-2);align-items:baseline;padding:var(--space-1) 0;${i > 0 ? 'border-top:1px solid var(--color-border-subtle);' : ''}font-size:var(--text-sm);">
          <span style="color:var(--color-text-tertiary);font-family:var(--font-code);min-width:24px">L${i + 1}</span>
          <span style="flex:1;font:${lang.font};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(line.text)}</span>
          <span style="color:var(--color-accent);font-family:var(--font-code);white-space:nowrap">${line.width.toFixed(1)}px</span>
        </div>
      `).join('')}
    `

    // Reset locale
    setLocale(undefined)
  }

  update()

  // Custom text input
  const customInput = document.getElementById('custom-input') as HTMLTextAreaElement
  const customDisplay = document.getElementById('custom-display')!

  customInput.addEventListener('input', () => {
    const text = customInput.value.trim()
    if (!text) {
      customDisplay.innerHTML = '<p style="color:var(--color-text-tertiary);font-size:var(--text-sm)">Enter text above to analyze it.</p>'
      return
    }

    const prepared = prepareWithSegments(text, '16px system-ui')
    const result = layoutWithLines(prepared, maxWidth, LINE_HEIGHT)

    customDisplay.innerHTML = `
      <div style="font-family:var(--font-code);font-size:var(--text-sm);margin-bottom:var(--space-3)">
        ${result.lineCount} lines, ${result.height}px height, ${prepared.segments.length} segments
      </div>
    `
    displaySegments(customDisplay, prepared)
  })

  const sourceCode = `import { prepareWithSegments, layoutWithLines, setLocale } from '@chenglou/pretext'

// Set locale for proper segmentation rules
setLocale('ja')

const prepared = prepareWithSegments(japaneseText, '16px system-ui')
const result = layoutWithLines(prepared, maxWidth, 24)

result.lines.forEach(line => {
  console.log(line.text, line.width)
})

// Reset to default
setLocale(undefined)

// Notes:
// - CJK characters can break between any two characters
// - Thai has no spaces between words — uses dictionary-based breaks
// - Arabic is RTL — segments are ordered visually
// - Emoji may have different widths across browsers`

  await createSourceViewer(document.getElementById('i18n-source')!, {
    code: sourceCode,
    title: 'i18n Usage',
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
