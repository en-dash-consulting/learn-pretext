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

import { tracks, getCurrentSlug, getPrevPage, getNextPage, getTrackForSlug } from './nav-data'

const slug = getCurrentSlug()

function buildShell() {
  const app = document.getElementById('app')
  if (!app) return

  const skipLink = document.createElement('a')
  skipLink.href = '#content'
  skipLink.className = 'skip-link'
  skipLink.textContent = 'Skip to content'
  document.body.prepend(skipLink)

  app.className = 'site'
  app.innerHTML = `
    ${buildHeader()}
    ${buildSidebar()}
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <main class="content" id="content">
      <div class="content__body" id="page-content"></div>
      ${buildPageNav()}
    </main>
    ${buildFooter()}
  `

  bindEvents()
}

function buildHeader(): string {
  const activeTrack = getTrackForSlug(slug)
  return `
    <header class="header">
      <a href="/" class="header__logo">Learn Pretext</a>
      <nav class="header__nav" aria-label="Track navigation">
        ${tracks.map(t => `
          <a href="${t.pages[0]!.href}"${t.title === activeTrack?.title ? ' class="active"' : ''}>${t.title}</a>
        `).join('')}
      </nav>
      <button class="header__hamburger" id="hamburger" aria-label="Open navigation">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </header>
  `
}

function buildSidebar(): string {
  return `
    <aside class="sidebar" id="sidebar" aria-label="Page navigation">
      ${tracks.map(t => `
        <div class="sidebar__track">
          <div class="sidebar__track-title">${t.title}</div>
          ${t.pages.map(p => `
            <a href="${p.href}" class="sidebar__link${p.slug === slug ? ' active' : ''}">${p.title}</a>
          `).join('')}
        </div>
      `).join('')}
    </aside>
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
  return `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__credits">
          <span>Built by <a href="https://endash.us" target="_blank" rel="noopener">En Dash</a></span>
          <span>Built with <a href="https://n-dx.dev" target="_blank" rel="noopener">n-dx</a> and <a href="https://claude.ai" target="_blank" rel="noopener">Claude</a></span>
        </div>
        <div class="footer__links">
          <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener">GitHub</a>
          <a href="https://www.npmjs.com/package/@chenglou/pretext" target="_blank" rel="noopener">npm</a>
        </div>
      </div>
    </footer>
  `
}

function bindEvents() {
  const hamburger = document.getElementById('hamburger')
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')

  function toggleSidebar() {
    sidebar?.classList.toggle('open')
    overlay?.classList.toggle('visible')
  }

  hamburger?.addEventListener('click', toggleSidebar)
  overlay?.addEventListener('click', toggleSidebar)
}

buildShell()
