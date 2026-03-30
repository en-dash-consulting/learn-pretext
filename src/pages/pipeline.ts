import { prepareWithSegments, layout } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT, timeExecution } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'
import { createPerfMeter } from '../components/performance-meter'

const KIND_COLORS: Record<string, string> = {
  'text': '#6e9eff',
  'space': '#666',
  'glue': '#fbbf24',
  'soft-hyphen': '#f87171',
  'hard-break': '#4ade80',
  'tab': '#a78bfa',
  'preserved-space': '#888',
  'zero-width-break': '#f97316',
}

const DEFAULT_TEXT = 'The quick brown\u00A0fox jumps over the lazy dog. Pack my box with\u00ADfive dozen liquor jugs!'

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">The Pipeline</h1>
      <p class="content__subtitle">Deep dive into <span class="api-tag">prepare()</span> — see how text is normalized, segmented, and measured.</p>
    </div>

    <div class="content__section">
      <h2>Input</h2>
      <div style="margin-bottom:var(--space-4)">
        <label style="display:block;font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-2)">Enter custom text (supports non-breaking spaces \\u00A0, soft hyphens \\u00AD, etc.)</label>
        <input id="text-input" type="text" value="${DEFAULT_TEXT.replace(/"/g, '&quot;')}" style="width:100%;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-2) var(--space-3);color:var(--color-text);font:var(--text-base) var(--font-body);" />
      </div>
      <div id="pipeline-perf" style="margin-bottom:var(--space-6)"></div>
    </div>

    <div class="content__section">
      <h2>Step 1: Raw Text</h2>
      <p>The input text as-is, with special characters highlighted.</p>
      <div class="demo-area" id="step-raw"></div>
    </div>

    <div class="content__section">
      <h2>Step 2: After Normalization</h2>
      <p>Whitespace is collapsed: multiple spaces become one, leading/trailing whitespace is trimmed, newlines become spaces (in normal white-space mode).</p>
      <div class="demo-area" id="step-normalized"></div>
    </div>

    <div class="content__section">
      <h2>Step 3: Segmentation</h2>
      <p>Text is split into segments by the Intl.Segmenter API and classified by kind. Each segment is a unit for line-breaking decisions.</p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-3)">
        ${Object.entries(KIND_COLORS).map(([kind, color]) => `
          <span style="display:inline-flex;align-items:center;gap:var(--space-1);font-size:var(--text-xs)">
            <span style="width:12px;height:12px;border-radius:2px;background:${color}"></span>
            <span style="color:var(--color-text-secondary)">${kind}</span>
          </span>
        `).join('')}
      </div>
      <div class="demo-area" id="step-segments" style="overflow-x:auto"></div>
    </div>

    <div class="content__section">
      <h2>Step 4: Measurement</h2>
      <p>Each segment is measured using the canvas API. Widths are cached per font so subsequent <code>prepare()</code> calls with the same font reuse cached values.</p>
      <div class="demo-area" id="step-measurements" style="overflow-x:auto"></div>
    </div>

    <div id="pipeline-source" style="margin-top:var(--space-8)"></div>
  `

  const textInput = document.getElementById('text-input') as HTMLInputElement
  const perfMeter = createPerfMeter(document.getElementById('pipeline-perf')!)

  function update() {
    const text = textInput.value || DEFAULT_TEXT

    // Step 1: Raw text
    const rawEl = document.getElementById('step-raw')!
    rawEl.innerHTML = ''
    const rawPre = document.createElement('div')
    rawPre.style.cssText = `font-family:var(--font-code);font-size:var(--text-sm);white-space:pre-wrap;word-break:break-all;`

    // Highlight special chars
    let rawHtml = ''
    for (const char of text) {
      const code = char.codePointAt(0)!
      if (code === 0x00A0) {
        rawHtml += '<span style="background:#fbbf24;color:#000;border-radius:2px;padding:0 2px" title="Non-breaking space U+00A0">NBSP</span>'
      } else if (code === 0x00AD) {
        rawHtml += '<span style="background:#f87171;color:#000;border-radius:2px;padding:0 2px" title="Soft hyphen U+00AD">SHY</span>'
      } else if (code === 0x200B) {
        rawHtml += '<span style="background:#f97316;color:#000;border-radius:2px;padding:0 2px" title="Zero-width space U+200B">ZWS</span>'
      } else if (char === '\n') {
        rawHtml += '<span style="background:#4ade80;color:#000;border-radius:2px;padding:0 2px" title="Line feed">LF</span>\n'
      } else if (char === '\t') {
        rawHtml += '<span style="background:#a78bfa;color:#000;border-radius:2px;padding:0 2px" title="Tab">TAB</span>'
      } else if (char === ' ') {
        rawHtml += '<span style="background:rgba(102,102,102,0.3);border-radius:1px">\u00B7</span>'
      } else {
        rawHtml += escapeHtml(char)
      }
    }
    rawPre.innerHTML = rawHtml
    rawEl.appendChild(rawPre)

    // Prepare with segments — this is the core call
    const { result: prepared, elapsed: prepareTime } = timeExecution(() =>
      prepareWithSegments(text, FONT)
    )

    perfMeter.update([
      { label: 'prepare()', value: prepareTime },
      { label: 'Segments', value: prepared.segments.length },
    ])

    // Step 2: Normalized text
    const normEl = document.getElementById('step-normalized')!
    const normalizedText = prepared.segments.join('')
    normEl.innerHTML = ''
    const normPre = document.createElement('div')
    normPre.style.cssText = `font-family:var(--font-code);font-size:var(--text-sm);white-space:pre-wrap;word-break:break-all;`
    normPre.textContent = normalizedText
    normEl.appendChild(normPre)

    if (normalizedText !== text) {
      const diffNote = document.createElement('div')
      diffNote.style.cssText = 'margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-warning);'
      diffNote.textContent = `Normalization changed the text (${text.length} chars -> ${normalizedText.length} chars)`
      normEl.appendChild(diffNote)
    }

    // Step 3: Segments with kinds
    const segEl = document.getElementById('step-segments')!
    segEl.innerHTML = ''
    const segContainer = document.createElement('div')
    segContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;align-items:flex-start;'

    prepared.segments.forEach((seg, i) => {
      const kind = prepared.kinds[i] ?? 'text'
      const color = KIND_COLORS[kind] ?? '#6e9eff'

      const chip = document.createElement('div')
      chip.style.cssText = `
        display:inline-flex;flex-direction:column;align-items:center;
        border:1px solid ${color};border-radius:var(--radius-sm);
        padding:var(--space-1) var(--space-2);background:${color}15;
        font-family:var(--font-code);font-size:var(--text-xs);
      `

      const segText = document.createElement('span')
      segText.style.cssText = `color:${color};font-weight:500;white-space:pre;`
      if (seg === ' ') {
        segText.textContent = '\u2423' // open box for space
      } else if (seg === '\n') {
        segText.textContent = '\u21B5' // return symbol
      } else if (seg === '\t') {
        segText.textContent = '\u21E5' // tab
      } else if (seg === '\u00AD') {
        segText.textContent = 'SHY'
      } else {
        segText.textContent = seg
      }

      const kindLabel = document.createElement('span')
      kindLabel.style.cssText = `font-size:10px;color:var(--color-text-tertiary);margin-top:1px;`
      kindLabel.textContent = kind

      chip.appendChild(segText)
      chip.appendChild(kindLabel)
      segContainer.appendChild(chip)
    })
    segEl.appendChild(segContainer)

    // Step 4: Measurements
    const measEl = document.getElementById('step-measurements')!
    measEl.innerHTML = ''
    const measContainer = document.createElement('div')
    measContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;align-items:flex-start;'

    prepared.segments.forEach((seg, i) => {
      const width = prepared.widths[i] ?? 0
      const kind = prepared.kinds[i] ?? 'text'
      const color = KIND_COLORS[kind] ?? '#6e9eff'

      const chip = document.createElement('div')
      chip.style.cssText = `
        display:inline-flex;flex-direction:column;align-items:center;
        border:1px solid var(--color-border);border-radius:var(--radius-sm);
        padding:var(--space-1) var(--space-2);background:var(--color-bg-surface);
        font-family:var(--font-code);font-size:var(--text-xs);
      `

      const segText = document.createElement('span')
      segText.style.cssText = `color:${color};font-weight:500;white-space:pre;`
      segText.textContent = seg === ' ' ? '\u2423' : seg === '\u00AD' ? 'SHY' : seg

      const widthLabel = document.createElement('span')
      widthLabel.style.cssText = `font-size:10px;color:var(--color-accent);margin-top:1px;`
      widthLabel.textContent = `${width.toFixed(1)}px`

      chip.appendChild(segText)
      chip.appendChild(widthLabel)
      measContainer.appendChild(chip)
    })
    measEl.appendChild(measContainer)

    // Total width info
    const totalWidth = prepared.widths.reduce((sum, w) => sum + w, 0)
    const totalNote = document.createElement('div')
    totalNote.style.cssText = 'margin-top:var(--space-3);font-size:var(--text-xs);color:var(--color-text-tertiary);font-family:var(--font-code);'
    totalNote.textContent = `Total measured width: ${totalWidth.toFixed(1)}px across ${prepared.segments.length} segments`
    measEl.appendChild(totalNote)
  }

  textInput.addEventListener('input', update)
  update()

  const sourceCode = `import { prepareWithSegments } from '@chenglou/pretext'

// prepareWithSegments gives access to the segments array
const prepared = prepareWithSegments(text, '16px Inter')

// prepared.segments: string[]     — the text segments
// prepared.widths:   number[]     — pixel width of each segment
// prepared.kinds:    SegmentBreakKind[]  — 'text'|'space'|'glue'|'soft-hyphen'|...

// Segment kinds determine line-breaking behavior:
// - 'text':        regular text, no break allowed before it
// - 'space':       breakable whitespace (collapsed in normal mode)
// - 'glue':        non-breaking space (\\u00A0), keeps words together
// - 'soft-hyphen': optional hyphenation point (\\u00AD)
// - 'hard-break':  forced line break (\\n)
// - 'tab':         tab character, advances to next tab stop
// - 'zero-width-break': breakable point with no visible width

prepared.segments.forEach((seg, i) => {
  console.log(\`[\${prepared.kinds[i]}] "\${seg}" — \${prepared.widths[i].toFixed(1)}px\`)
})`

  await createSourceViewer(document.getElementById('pipeline-source')!, {
    code: sourceCode,
    title: 'Pipeline Inspection Code',
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
