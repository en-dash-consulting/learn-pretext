import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import './styles/reset.css'
import './styles/variables.css'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/controls.css'

import { tracks, getCurrentSlug, getPrevPage, getNextPage, getTrackForSlug, getBase } from './nav-data'
import { createSearchButton, initSearch, openSearch } from '../components/search'
import { initAnalytics } from './analytics'
import { initMuseum } from './museum'
import { buildControls, initControls } from './controls'

const slug = getCurrentSlug()
const currentTrack = getTrackForSlug(slug)

// Set track-specific CSS variables
function setTrackTheme() {
  const root = document.documentElement
  const trackMap: Record<string, { color: string; glow: string }> = {
    'Foundations': { color: 'var(--track-foundations)', glow: 'var(--track-foundations-glow)' },
    'Core Patterns': { color: 'var(--track-core)', glow: 'var(--track-core-glow)' },
    'Advanced': { color: 'var(--track-advanced)', glow: 'var(--track-advanced-glow)' },
    'Creative': { color: 'var(--track-creative)', glow: 'var(--track-creative-glow)' },
    'Reference': { color: 'var(--track-reference)', glow: 'var(--track-reference-glow)' },
  }
  if (currentTrack && trackMap[currentTrack.title]) {
    root.style.setProperty('--track-color', trackMap[currentTrack.title]!.color)
    root.style.setProperty('--track-glow', trackMap[currentTrack.title]!.glow)
  }
}

function buildShell() {
  const app = document.getElementById('app')
  if (!app) return

  setTrackTheme()

  const skipLink = document.createElement('a')
  skipLink.href = '#content'
  skipLink.className = 'skip-link'
  skipLink.textContent = 'Skip to content'
  document.body.prepend(skipLink)

  // Vignette overlay
  const vignette = document.createElement('div')
  vignette.className = 'museum-vignette'
  document.body.prepend(vignette)

  app.className = 'site'
  app.innerHTML = `
    ${buildFloatingNav()}
    ${buildMobileMenu()}
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <main class="content" id="content">
      <div class="content__body" id="page-content"></div>
      ${buildPageNav()}
    </main>
    ${buildFooter()}
    ${slug === 'home' ? buildControls() : ''}
  `

  bindEvents()
  if (slug === 'home') initControls()
  initScrollReveal()
}

function buildFloatingNav(): string {
  return `
    <nav class="museum-nav" id="museum-nav" aria-label="Site navigation">
      <a href="${getBase()}/" class="museum-nav__logo">Learn Pretext</a>
      <div class="museum-nav__links">
        ${tracks.map(t => {
          // For Foundations, link to "Why Pretext" (skip Home)
          const linkPage = t.title === 'Foundations' ? (t.pages[1] ?? t.pages[0]!) : t.pages[0]!
          return `<a href="${linkPage.href}" class="museum-nav__link${t.title === currentTrack?.title ? ' active' : ''}">${t.title}</a>`
        }).join('')}
      </div>
      <div class="museum-nav__actions">
        ${createSearchButton()}
        <a href="https://github.com/en-dash-consulting/learn-pretext" target="_blank" rel="noopener" class="header__star museum-nav__action" aria-label="Star on GitHub">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
        </a>
        <button class="museum-nav__hamburger" id="hamburger" aria-label="Open navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </nav>
  `
}

function buildMobileMenu(): string {
  return `
    <div class="mobile-menu" id="mobile-menu">
      ${tracks.map(t => `
        <div class="mobile-menu__track">
          <div class="mobile-menu__track-title">${t.title}</div>
          ${t.pages.map(p => `
            <a href="${p.href}" class="mobile-menu__link${p.slug === slug ? ' active' : ''}">${p.title}</a>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `
}

function buildPageNav(): string {
  const prev = getPrevPage(slug)
  const next = getNextPage(slug)

  if (!prev && !next) return ''

  return `
    <nav class="page-nav" aria-label="Page navigation">
      ${prev ? `
        <a href="${prev.href}" class="page-nav__link page-nav__link--prev">
          <span class="page-nav__label">&larr; Previous</span>
          <span class="page-nav__title">${prev.title}</span>
        </a>
      ` : '<div></div>'}
      ${next ? `
        <a href="${next.href}" class="page-nav__link page-nav__link--next">
          <span class="page-nav__label">Next &rarr;</span>
          <span class="page-nav__title">${next.title}</span>
        </a>
      ` : ''}
    </nav>
  `
}

function buildFooter(): string {
  const gettingStartedPage = tracks[0]?.pages[2]
  const aboutPage = tracks[4]?.pages[4]
  return `
    <footer class="footer">
      <div class="footer__endash-cta">
        <div class="footer__endash-bar"></div>
        <p class="footer__endash-headline">Built for people everywhere, by people at <a href="https://endash.us" target="_blank" rel="noopener">En Dash</a></p>
        <p class="footer__endash-sub">We build tools that make work better and feel better.</p>
        <a href="https://endash.us" target="_blank" rel="noopener" class="footer__endash-link">Learn more about En Dash &rarr;</a>
      </div>
      <div class="footer__inner">
        <div class="footer__brand">
          <div class="footer__logo">Learn Pretext</div>
          <p class="footer__tagline">An independent learning resource for <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener">@chenglou/pretext</a></p>
        </div>
        <div class="footer__columns">
          <div class="footer__column">
            <div class="footer__column-title">Learn</div>
            ${gettingStartedPage ? `<a href="${gettingStartedPage.href}">Getting Started</a>` : ''}
            <a href="${tracks[1]?.pages[0]?.href ?? '#'}">Core Patterns</a>
            <a href="${tracks[2]?.pages[0]?.href ?? '#'}">Advanced</a>
          </div>
          <div class="footer__column">
            <div class="footer__column-title">Resources</div>
            <a href="https://github.com/en-dash-consulting/learn-pretext" target="_blank" rel="noopener">Source Code</a>
            <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener">Pretext Library</a>
            ${aboutPage ? `<a href="${aboutPage.href}">About This Site</a>` : ''}
          </div>
          <div class="footer__column">
            <div class="footer__column-title">Made by</div>
            <a href="https://endash.us" target="_blank" rel="noopener">En Dash</a>
            <a href="https://n-dx.dev" target="_blank" rel="noopener">n-dx</a>
            <a href="https://claude.ai" target="_blank" rel="noopener">Claude</a>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <span>Built by <a href="https://endash.us" target="_blank" rel="noopener">En Dash</a> with <a href="https://n-dx.dev" target="_blank" rel="noopener">n-dx</a> and <a href="https://claude.ai" target="_blank" rel="noopener">Claude</a></span>
      </div>
    </footer>
  `
}

function bindEvents() {
  const hamburger = document.getElementById('hamburger')
  const mobileMenu = document.getElementById('mobile-menu')
  const overlay = document.getElementById('sidebar-overlay')

  function toggleMenu() {
    mobileMenu?.classList.toggle('open')
    overlay?.classList.toggle('visible')
  }

  hamburger?.addEventListener('click', toggleMenu)
  overlay?.addEventListener('click', toggleMenu)

  // Search
  initSearch()
  const searchTrigger = document.getElementById('search-trigger')
  searchTrigger?.addEventListener('click', openSearch)
}

// Floating nav appears after scrolling past the hero
function initScrollReveal() {
  const nav = document.getElementById('museum-nav')
  if (!nav) return

  // On homepage, show after scrolling past the portal
  // On all other pages, show immediately
  if (slug !== 'home') {
    nav.classList.add('visible')
  } else {
    const threshold = window.innerHeight * 0.3
    let visible = false
    const navEl = nav
    function checkScroll() {
      const shouldShow = window.scrollY > threshold
      if (shouldShow !== visible) {
        visible = shouldShow
        navEl.classList.toggle('visible', visible)
      }
    }
    window.addEventListener('scroll', checkScroll, { passive: true })
  }

  // Museum scroll reveal for content sections
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  )

  // Observe all museum-reveal elements
  requestAnimationFrame(() => {
    document.querySelectorAll('.museum-reveal').forEach(el => observer.observe(el))
  })
}

buildShell()
initAnalytics()
initMuseum()
