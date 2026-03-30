import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { waitForFonts, FONT, LINE_HEIGHT } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

const MESSAGES = [
  { from: 'left', text: 'Hey! Have you seen the new pretext library?' },
  { from: 'right', text: 'No, what is it?' },
  { from: 'left', text: 'It measures multiline text without touching the DOM. Pure arithmetic over cached glyph widths.' },
  { from: 'right', text: 'Wait, how does that even work?' },
  { from: 'left', text: 'You call prepare() once to cache glyph measurements, then layout() to compute line breaks. Same algorithm the browser uses, but no reflow.' },
  { from: 'right', text: 'That sounds useful for chat bubbles. Getting the right width has always been annoying.' },
  { from: 'left', text: 'Exactly! You can use walkLineRanges() to find the widest line and set the bubble width to that. True shrink-wrapping.' },
  { from: 'right', text: 'Better than CSS fit-content?' },
  { from: 'left', text: 'Way better. fit-content gives you the max-width for multiline text, not the actual widest line. So bubbles end up wider than they need to be.' },
  { from: 'right', text: 'Oh right, I always wondered why my chat bubbles looked so wide on short messages that wrap.' },
  { from: 'left', text: 'Yeah, the savings can be 20-100px per bubble. Really adds up visually.' },
  { from: 'right', text: 'Nice! Is it fast enough for real-time?' },
  { from: 'left', text: 'layout() takes ~0.01ms per call. You could measure 1000 bubbles in 10ms.' },
  { from: 'right', text: 'That is absurdly fast.' },
  { from: 'left', text: 'And it handles emoji, CJK, RTL, soft hyphens — everything the browser handles.' },
  { from: 'right', text: 'What about variable fonts or different sizes?' },
  { from: 'left', text: 'You specify the font string like "16px Inter" in prepare(). The cache is per-font, so different sizes get separate caches.' },
  { from: 'right', text: 'I need to try this on our messaging app.' },
  { from: 'left', text: 'Do it! The API is tiny: prepare, layout, prepareWithSegments, layoutWithLines, walkLineRanges, layoutNextLine, clearCache, setLocale.' },
  { from: 'right', text: 'That is a small surface area. I like it.' },
  { from: 'left', text: 'Minimal API, maximum utility. The whole library is a single file.' },
]

const MAX_BUBBLE_WIDTH = 320
const BUBBLE_PADDING = 24 // 12px each side

function getShrinkWrappedWidth(prepared: PreparedTextWithSegments, maxContentWidth: number): number {
  let maxLineWidth = 0
  walkLineRanges(prepared, maxContentWidth, (line) => {
    if (line.width > maxLineWidth) maxLineWidth = line.width
  })
  return Math.ceil(maxLineWidth)
}

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Chat Bubbles</h1>
      <p class="content__subtitle">True shrink-wrapping with <span class="api-tag">walkLineRanges()</span> — set each bubble to the exact width of its widest line.</p>
    </div>

    <div class="content__section">
      <h2>Demo</h2>
      <p>Left bubbles use pretext shrink-wrapping. Right bubbles show CSS <code>fit-content</code> for comparison. The pixel savings are shown on each bubble.</p>
      <div class="demo-area" id="chat-container" style="max-height:600px;overflow-y:auto;padding:var(--space-4)">
        <div id="chat-messages"></div>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--color-border)">
          <input id="chat-input" type="text" placeholder="Type a message..." style="flex:1;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:var(--space-2) var(--space-3);color:var(--color-text);font:var(--text-base) var(--font-body);" />
          <button id="chat-send" style="padding:var(--space-2) var(--space-4);background:var(--color-accent);color:var(--color-text-inverse);border:none;border-radius:var(--radius-sm);cursor:pointer;font-weight:500;">Send</button>
        </div>
      </div>
      <div id="bubbles-source" style="margin-top:var(--space-4)"></div>
    </div>

    <div class="content__section">
      <div class="explanation">
        <h3>CSS fit-content vs Pretext Shrink-Wrap</h3>
        <p>When a chat bubble's text wraps to multiple lines, CSS <code>width: fit-content</code> sets the bubble to the <strong>max-width</strong> — the width at which the text would fit on a single line (clamped to the max bubble width). This is often significantly wider than the actual widest rendered line.</p>
        <p>Pretext's <span class="api-tag">walkLineRanges()</span> iterates over each line and reports its exact pixel width. By taking the maximum, we get the true shrink-wrap width.</p>
        <div class="key-insight">The visual difference is subtle per bubble but creates a noticeably cleaner look across a full conversation. Slack, Discord, and iMessage all use similar techniques internally.</div>
      </div>
    </div>
  `

  const messagesContainer = document.getElementById('chat-messages')!
  const chatInput = document.getElementById('chat-input') as HTMLInputElement
  const chatSend = document.getElementById('chat-send')!

  let msgSide = MESSAGES.length % 2 === 0 ? 'left' : 'right'

  function renderMessage(msg: { from: string; text: string }) {
    const isLeft = msg.from === 'left'
    const prepared = prepareWithSegments(msg.text, FONT)
    const maxContentWidth = MAX_BUBBLE_WIDTH - BUBBLE_PADDING
    const shrinkWidth = getShrinkWrappedWidth(prepared, maxContentWidth)
    const pretextBubbleWidth = Math.min(shrinkWidth + BUBBLE_PADDING, MAX_BUBBLE_WIDTH)

    // Create the row
    const row = document.createElement('div')
    row.style.cssText = `display:flex;flex-direction:column;align-items:${isLeft ? 'flex-start' : 'flex-end'};margin-bottom:var(--space-2);`

    // Pretext bubble (shown for left, measuring for right too)
    const bubble = document.createElement('div')
    bubble.style.cssText = `
      max-width:${MAX_BUBBLE_WIDTH}px;
      width:${pretextBubbleWidth}px;
      padding:var(--space-2) var(--space-3);
      border-radius:${isLeft ? 'var(--radius-sm) var(--radius-md) var(--radius-md) var(--radius-md)' : 'var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-md)'};
      background:${isLeft ? 'var(--color-bg-surface)' : 'var(--color-accent)'};
      color:${isLeft ? 'var(--color-text)' : 'var(--color-text-inverse)'};
      font:${FONT};
      line-height:${LINE_HEIGHT}px;
      word-wrap:break-word;
    `
    bubble.textContent = msg.text

    // Also measure what CSS fit-content would give
    const fitContentBubble = document.createElement('div')
    fitContentBubble.style.cssText = `position:absolute;top:-9999px;left:-9999px;max-width:${MAX_BUBBLE_WIDTH}px;width:fit-content;padding:var(--space-2) var(--space-3);font:${FONT};line-height:${LINE_HEIGHT}px;word-wrap:break-word;`
    fitContentBubble.textContent = msg.text
    document.body.appendChild(fitContentBubble)
    const fitContentWidth = fitContentBubble.offsetWidth
    document.body.removeChild(fitContentBubble)

    const savings = fitContentWidth - pretextBubbleWidth

    row.appendChild(bubble)

    if (savings > 0) {
      const savingsLabel = document.createElement('div')
      savingsLabel.style.cssText = `font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:2px;font-family:var(--font-code);`
      savingsLabel.textContent = `pretext: ${pretextBubbleWidth}px | fit-content: ${fitContentWidth}px | saved: ${savings}px`
      row.appendChild(savingsLabel)
    }

    messagesContainer.appendChild(row)
  }

  // Render initial messages
  MESSAGES.forEach(msg => renderMessage(msg))

  // Scroll to bottom
  const chatContainer = document.getElementById('chat-container')!
  chatContainer.scrollTop = chatContainer.scrollHeight

  function sendMessage() {
    const text = chatInput.value.trim()
    if (!text) return

    msgSide = msgSide === 'left' ? 'right' : 'left'
    renderMessage({ from: msgSide, text })
    chatInput.value = ''
    chatContainer.scrollTop = chatContainer.scrollHeight
  }

  chatSend.addEventListener('click', sendMessage)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage()
  })

  const sourceCode = `import { prepareWithSegments, walkLineRanges } from '@chenglou/pretext'

const MAX_BUBBLE_WIDTH = 320
const BUBBLE_PADDING = 24

function getShrinkWrappedWidth(text: string, maxContentWidth: number) {
  const prepared = prepareWithSegments(text, '16px Inter')
  let maxLineWidth = 0

  walkLineRanges(prepared, maxContentWidth, (line) => {
    if (line.width > maxLineWidth) maxLineWidth = line.width
  })

  return Math.ceil(maxLineWidth)
}

// Set the bubble width to the actual widest line
const contentWidth = getShrinkWrappedWidth(text, MAX_BUBBLE_WIDTH - BUBBLE_PADDING)
bubble.style.width = \`\${contentWidth + BUBBLE_PADDING}px\``

  await createSourceViewer(document.getElementById('bubbles-source')!, {
    code: sourceCode,
    title: 'Shrink-Wrap Implementation',
  })
}

init()
