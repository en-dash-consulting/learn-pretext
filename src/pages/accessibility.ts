import { waitForFonts } from '../shared/pretext-helpers'
import { createSourceViewer } from '../components/source-viewer'

async function init() {
  const content = document.getElementById('page-content')
  if (!content) return

  await waitForFonts()

  content.innerHTML = `
    <div class="content__header">
      <h1 class="content__title">Accessibility</h1>
      <p class="content__subtitle">How to keep your UI accessible when using pretext for text measurement and layout.</p>
    </div>

    <div class="content__section">
      <h2>The Accessibility Challenge</h2>
      <div class="explanation">
        <p>Pretext computes text dimensions and line breaks using pure arithmetic rather than the DOM. This speed is its greatest strength, but it comes with a responsibility: when you use pretext to control layout — especially for canvas rendering, virtualized lists, or custom text flow — you are taking text out of the browser's normal rendering pipeline.</p>
        <p>The browser's built-in text rendering is deeply integrated with assistive technology. Screen readers traverse the DOM, not your JavaScript data structures. Keyboard navigation relies on focusable elements the browser can see. If you bypass the DOM for visual output, you need to ensure that equivalent information is still available to users who rely on assistive technology.</p>
        <div class="key-insight">Pretext measures text, it does not replace the DOM. Use its measurements to enhance layout, but always keep content accessible through standard HTML elements.</div>
      </div>
    </div>

    <div class="content__section">
      <h2>DOM Text Is Still King for Accessibility</h2>
      <div class="explanation">
        <p>The most important rule: <strong>always render your text in the DOM</strong> for screen readers, even if you use pretext measurements to position or size the containers. Pretext gives you dimensions — use those dimensions to set <code>height</code>, <code>width</code>, or container styles, but render the actual text as HTML text nodes.</p>
        <p>This is the pattern used throughout this site. Every demo measures text with pretext but renders it as real DOM content. The accordion demo, for instance, uses pretext to calculate the expanded height of panels, then animates the container to that height — the text itself is always standard HTML.</p>
        <div class="key-insight">Think of pretext as a ruler, not a renderer. You measure with pretext, then render with the DOM.</div>
      </div>
      <div id="recipe-dom-measure"></div>
    </div>

    <div class="content__section">
      <h2>Virtualized Lists</h2>
      <div class="explanation">
        <p>Virtualized lists are one of the most impactful uses of pretext — you can measure the height of thousands of items without rendering them, enabling smooth virtual scrolling. But virtualization means most items are not in the DOM at any given time, which creates accessibility gaps.</p>
        <h3>Key ARIA attributes for virtualized lists</h3>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li><code>role="listbox"</code> or <code>role="list"</code> on the scroll container tells assistive tech this is a list.</li>
          <li><code>aria-setsize</code> on each visible item declares the total number of items in the full list, even though most are not rendered.</li>
          <li><code>aria-posinset</code> on each visible item declares its 1-based position in the full list.</li>
          <li><code>aria-label</code> on the container provides context about what the list contains.</li>
        </ul>
        <p>Additionally, consider providing a way for users to access all content without virtualization — for example, a "Show all" button that renders the full list for assistive technology users, or a search/filter that narrows results to a manageable number.</p>
      </div>
      <div id="recipe-virtual-a11y"></div>
    </div>

    <div class="content__section">
      <h2>Canvas Rendering</h2>
      <div class="explanation">
        <p>Canvas is completely opaque to assistive technology. Screen readers cannot read text drawn on a canvas element. If you use pretext to measure and break text and then render it on canvas (as shown in the <a href="/pages/canvas.html">Canvas Rendering</a> page), you <strong>must</strong> provide an accessible alternative.</p>
        <h3>Strategies for canvas accessibility</h3>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li><strong>Hidden DOM mirror:</strong> Render the same text in a visually hidden element that screen readers can access. Keep it synchronized with what the canvas displays.</li>
          <li><strong><code>aria-label</code> on the canvas:</strong> For short text or non-interactive canvas content, an <code>aria-label</code> attribute can provide the text content.</li>
          <li><strong>Fallback content:</strong> Place fallback content inside the <code>&lt;canvas&gt;</code> element. Browsers that do not support canvas, and some screen readers, will present this content instead.</li>
        </ul>
        <div class="key-insight">The hidden DOM mirror approach is the most robust. It maintains the full text content in a form that assistive technology can traverse, while the canvas handles the visual presentation.</div>
      </div>
      <div id="recipe-canvas-a11y"></div>
    </div>

    <div class="content__section">
      <h2>Interactive Controls and ARIA</h2>
      <div class="explanation">
        <p>All interactive demos on this site follow accessibility best practices for custom controls:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li><strong>Semantic roles:</strong> Custom widgets use <code>role="button"</code>, <code>role="slider"</code>, <code>role="listbox"</code>, etc. so assistive tech announces them correctly.</li>
          <li><strong>ARIA states:</strong> Interactive elements declare their state with <code>aria-expanded</code>, <code>aria-selected</code>, <code>aria-checked</code>, and other ARIA attributes.</li>
          <li><strong>Keyboard support:</strong> Every interactive element is reachable via Tab and operable via Enter, Space, or arrow keys as appropriate.</li>
          <li><strong>Focus management:</strong> When dialogs open, focus moves to them. When they close, focus returns to the trigger. The search modal on this site demonstrates this pattern.</li>
          <li><strong>Labels:</strong> All controls have an accessible name via <code>aria-label</code>, <code>aria-labelledby</code>, or visible text.</li>
        </ul>
        <p>When you build custom UI that uses pretext measurements (for example, a custom dropdown sized to its content), apply these same ARIA patterns to ensure the controls are perceivable and operable by all users.</p>
      </div>
      <div id="recipe-aria-controls"></div>
    </div>

    <div class="content__section">
      <h2>Respecting prefers-reduced-motion</h2>
      <div class="explanation">
        <p>Some users configure their operating system to reduce motion, which the browser exposes via the <code>prefers-reduced-motion</code> media query. This site respects this preference — animations are disabled or simplified when the user prefers reduced motion.</p>
        <p>When building layouts with pretext, you may use its measurements to animate text containers (expanding, collapsing, reflowing). Always check the user's motion preference and skip or simplify animations accordingly.</p>
      </div>
      <div id="recipe-reduced-motion"></div>
    </div>

    <div class="content__section">
      <h2>Color Contrast</h2>
      <div class="explanation">
        <p>Pretext itself does not affect color — it only deals with text dimensions. But when you build UIs that use pretext measurements to position text, you are responsible for maintaining sufficient color contrast.</p>
        <h3>WCAG AA requirements</h3>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li><strong>Normal text:</strong> at least 4.5:1 contrast ratio against the background.</li>
          <li><strong>Large text</strong> (18px+ bold, or 24px+ normal): at least 3:1 contrast ratio.</li>
          <li><strong>UI components:</strong> interactive elements and their borders need at least 3:1 against adjacent colors.</li>
        </ul>
        <p>This site's design system uses carefully chosen color variables. The primary text color <code>--color-text</code> (#ededf0) against <code>--color-bg</code> (#09090b) provides a contrast ratio well above 4.5:1. The secondary text color <code>--color-text-secondary</code> (#a0a0b0) is reserved for larger or supplementary text. The accent color <code>--color-accent</code> (#818cf8) is used for links and highlights where contrast requirements are met.</p>
        <div class="key-insight">When rendering text on canvas, you control colors programmatically. Double-check that your fillStyle / strokeStyle values meet WCAG contrast requirements against the canvas background.</div>
      </div>
    </div>

    <div class="content__section">
      <h2>Summary</h2>
      <div class="explanation">
        <p>Pretext is a measurement tool, not a rendering tool. As long as you follow these principles, your pretext-powered layouts can be fully accessible:</p>
        <ul style="list-style:none;padding:0;margin:var(--space-2) 0;display:flex;flex-direction:column;gap:var(--space-3);font-size:var(--text-sm);color:var(--color-text-secondary)">
          <li><strong>Render text in the DOM</strong> for screen readers. Use pretext measurements for sizing, not for replacing HTML rendering.</li>
          <li><strong>Annotate virtualized lists</strong> with <code>aria-setsize</code> and <code>aria-posinset</code>. Provide a way to access all content.</li>
          <li><strong>Mirror canvas text</strong> in a hidden DOM element so screen readers can access it.</li>
          <li><strong>Use proper ARIA</strong> on all custom controls: roles, states, labels, and keyboard handlers.</li>
          <li><strong>Respect prefers-reduced-motion</strong> when animating layout changes.</li>
          <li><strong>Maintain WCAG AA contrast</strong> ratios in all text rendering, especially on canvas.</li>
        </ul>
      </div>
    </div>
  `

  // Render source viewer recipes
  await Promise.all([
    createSourceViewer(document.getElementById('recipe-dom-measure')!, {
      code: `// Pattern: Measure with pretext, render in the DOM
import { prepare, layout } from '@chenglou/pretext'

const text = "Your content here..."
const font = "16px Inter"
const lineHeight = 24

// Step 1: Measure with pretext
const prepared = prepare(text, font)

// Step 2: Get dimensions for a given width
function updateLayout(containerWidth: number) {
  const { height, lineCount } = layout(prepared, containerWidth, lineHeight)

  // Step 3: Apply dimensions to the DOM container
  container.style.height = \`\${height}px\`

  // The text stays in the DOM as a normal text node
  // Screen readers can read it naturally
  container.textContent = text
}

// React to resizes
const observer = new ResizeObserver(entries => {
  updateLayout(entries[0].contentRect.width)
})
observer.observe(container)`,
      title: 'Recipe: DOM Text with Pretext Measurements',
    }),

    createSourceViewer(document.getElementById('recipe-virtual-a11y')!, {
      code: `// Pattern: Accessible virtualized list with ARIA
import { prepare, layout } from '@chenglou/pretext'

const allItems = getData() // Array of { id, text }
const font = "16px Inter"
const lineHeight = 24

// Measure all items upfront with pretext
const measured = allItems.map(item => {
  const prepared = prepare(item.text, font)
  const { height } = layout(prepared, containerWidth, lineHeight)
  return { ...item, prepared, height: height + 16 } // +padding
})

// Build the virtualized list container
const listEl = document.createElement('div')
listEl.setAttribute('role', 'list')
listEl.setAttribute('aria-label', 'Messages')

function renderVisibleItems(scrollTop: number, viewportHeight: number) {
  listEl.innerHTML = ''

  for (let i = 0; i < measured.length; i++) {
    const item = measured[i]
    const itemTop = getItemTop(i) // from position index

    // Only render items in the viewport
    if (itemTop + item.height < scrollTop) continue
    if (itemTop > scrollTop + viewportHeight) break

    const itemEl = document.createElement('div')
    itemEl.setAttribute('role', 'listitem')
    itemEl.setAttribute('aria-setsize', String(allItems.length))
    itemEl.setAttribute('aria-posinset', String(i + 1))
    itemEl.style.height = \`\${item.height}px\`
    itemEl.style.transform = \`translateY(\${itemTop}px)\`
    itemEl.textContent = item.text // Real DOM text
    listEl.appendChild(itemEl)
  }
}

// Optional: "Show all" for assistive tech users
const showAllBtn = document.createElement('button')
showAllBtn.textContent = 'Show all items'
showAllBtn.className = 'sr-only'
showAllBtn.addEventListener('click', () => {
  // Render all items in the DOM without virtualization
  disableVirtualization()
})`,
      title: 'Recipe: Accessible Virtualized List',
    }),

    createSourceViewer(document.getElementById('recipe-canvas-a11y')!, {
      code: `// Pattern: Canvas text rendering with hidden DOM mirror
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const text = "Your canvas text content here..."
const font = "16px Inter"
const lineHeight = 24

const prepared = prepareWithSegments(text, font)
const { lines } = layoutWithLines(prepared, canvasWidth, lineHeight)

// 1. Render on canvas (visual)
const ctx = canvas.getContext('2d')!
ctx.font = font
ctx.fillStyle = '#ededf0'

lines.forEach((line, i) => {
  ctx.fillText(line.text, 0, (i + 1) * lineHeight)
})

// 2. Create a hidden DOM mirror (accessible)
const mirror = document.createElement('div')
mirror.className = 'sr-only' // visually hidden but readable
mirror.setAttribute('aria-hidden', 'false')
mirror.textContent = text
canvas.parentElement!.appendChild(mirror)

// 3. Label the canvas
canvas.setAttribute('role', 'img')
canvas.setAttribute('aria-label', text)

// CSS for the sr-only class:
// .sr-only {
//   position: absolute;
//   width: 1px;
//   height: 1px;
//   padding: 0;
//   margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border: 0;
// }`,
      title: 'Recipe: Canvas with Hidden Text Mirror',
    }),

    createSourceViewer(document.getElementById('recipe-aria-controls')!, {
      code: `// Pattern: Accessible custom accordion with pretext measurement
import { prepare, layout } from '@chenglou/pretext'

interface AccordionItem {
  trigger: HTMLButtonElement
  panel: HTMLElement
  prepared: PreparedText
}

function createAccessibleAccordion(items: AccordionItem[]) {
  items.forEach((item, index) => {
    const { trigger, panel, prepared } = item

    // Set ARIA attributes on the trigger
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', panel.id)
    trigger.id = \`accordion-trigger-\${index}\`

    // Set ARIA attributes on the panel
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-labelledby', trigger.id)
    panel.hidden = true

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true'

      if (isOpen) {
        // Collapse
        trigger.setAttribute('aria-expanded', 'false')
        panel.style.height = '0px'
        panel.hidden = true
      } else {
        // Measure with pretext, then expand
        const width = panel.clientWidth
        const { height } = layout(prepared, width, 24)
        trigger.setAttribute('aria-expanded', 'true')
        panel.hidden = false
        panel.style.height = \`\${height}px\`
      }
    })

    // Keyboard support
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        items[(index + 1) % items.length].trigger.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        items[(index - 1 + items.length) % items.length].trigger.focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        items[0].trigger.focus()
      } else if (e.key === 'End') {
        e.preventDefault()
        items[items.length - 1].trigger.focus()
      }
    })
  })
}`,
      title: 'Recipe: Accessible Accordion Controls',
    }),

    createSourceViewer(document.getElementById('recipe-reduced-motion')!, {
      code: `// Pattern: Respecting prefers-reduced-motion
import { prepare, layout } from '@chenglou/pretext'

// Check the preference
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// Listen for changes (user can toggle while the page is open)
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
motionQuery.addEventListener('change', (e) => {
  if (e.matches) {
    // User now prefers reduced motion: disable animations
    disableAnimations()
  } else {
    // User now allows motion: enable animations
    enableAnimations()
  }
})

// Animate a pretext-measured layout change
function expandPanel(panel: HTMLElement, prepared: PreparedText) {
  const width = panel.clientWidth
  const { height } = layout(prepared, width, 24)

  if (prefersReducedMotion) {
    // Skip animation, apply instantly
    panel.style.height = \`\${height}px\`
  } else {
    // Animate with a transition
    panel.style.transition = 'height 220ms ease-out'
    panel.style.height = \`\${height}px\`
  }
}

// CSS approach (preferred when possible):
// @media (prefers-reduced-motion: reduce) {
//   * {
//     animation-duration: 0.01ms !important;
//     animation-iteration-count: 1 !important;
//     transition-duration: 0.01ms !important;
//   }
// }`,
      title: 'Recipe: Reduced Motion Check',
    }),
  ])
}

init()
