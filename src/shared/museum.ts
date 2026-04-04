/**
 * Museum interaction layer — ambient effects, scroll reveals, and spatial typography.
 * This module is loaded by the shell and enhances all pages automatically.
 */

// --- Scroll Reveal ---
// Automatically adds reveal animations to content sections

let revealObserver: IntersectionObserver | null = null

export function initMuseumReveals() {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  )

  // Watch for page content being populated
  const content = document.getElementById('page-content')
  if (!content) return

  const contentObserver = new MutationObserver(() => {
    enhanceContent(content)
  })

  contentObserver.observe(content, { childList: true, subtree: false })

  // Also try immediately in case content is already there
  requestAnimationFrame(() => enhanceContent(content))
}

function enhanceContent(container: HTMLElement) {
  if (!revealObserver) return

  // Add museum-reveal to content sections
  container.querySelectorAll('.content__section').forEach((section, i) => {
    if (!section.classList.contains('museum-reveal')) {
      section.classList.add('museum-reveal')
      ;(section as HTMLElement).style.transitionDelay = `${i * 60}ms`
      revealObserver!.observe(section)
    }
  })

  // Add museum-reveal to content header
  const header = container.querySelector('.content__header')
  if (header && !header.classList.contains('museum-reveal')) {
    header.classList.add('museum-reveal')
    // Headers get immediate reveal (no delay, fast)
    ;(header as HTMLElement).style.transitionDelay = '0ms'
    revealObserver.observe(header)
  }

  // Add museum-reveal to below-fold sections
  container.querySelectorAll('.museum-reveal').forEach(el => {
    revealObserver!.observe(el)
  })
}

// --- Ambient Cursor Glow ---
// Subtle glow that follows the cursor

let glowEl: HTMLElement | null = null

export function initCursorGlow() {
  // Skip on touch devices
  if ('ontouchstart' in window) return

  glowEl = document.createElement('div')
  glowEl.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(circle, rgba(129,140,248,0.015) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
    opacity: 0;
  `
  document.body.appendChild(glowEl)

  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0
  let visible = false

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX
    targetY = e.clientY
    if (!visible) {
      visible = true
      glowEl!.style.opacity = '1'
    }
  })

  document.addEventListener('mouseleave', () => {
    visible = false
    glowEl!.style.opacity = '0'
  })

  function updateGlow() {
    currentX += (targetX - currentX) * 0.08
    currentY += (targetY - currentY) * 0.08
    if (glowEl) {
      glowEl.style.left = `${currentX}px`
      glowEl.style.top = `${currentY}px`
    }
    requestAnimationFrame(updateGlow)
  }

  requestAnimationFrame(updateGlow)
}

// --- Parallax Depth ---
// Subtle parallax on scroll for layered elements

export function initParallaxDepth() {
  const content = document.querySelector('.content') as HTMLElement
  if (!content) return

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY
    // Apply subtle depth to the background gradient
    content.style.backgroundPositionY = `${scrolled * 0.3}px`
  }, { passive: true })
}

// --- Initialize all museum features ---

export function initMuseum() {
  initMuseumReveals()
  initCursorGlow()
  initParallaxDepth()
}
