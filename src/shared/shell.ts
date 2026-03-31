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

import { tracks, getCurrentSlug, getPrevPage, getNextPage, getTrackForSlug, getBase } from './nav-data'
import { createSearchButton, initSearch, openSearch } from '../components/search'
import { initAnalytics } from './analytics'

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
      <a href="${getBase()}/" class="header__logo">Learn Pretext</a>
      <nav class="header__nav" aria-label="Track navigation">
        ${tracks.map(t => `
          <a href="${t.pages[0]!.href}"${t.title === activeTrack?.title ? ' class="active"' : ''}>${t.title}</a>
        `).join('')}
      </nav>
      ${createSearchButton()}
      <a href="https://github.com/en-dash-consulting/learn-pretext" target="_blank" rel="noopener" class="header__star" aria-label="Star this repo on GitHub">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
        <span class="header__star-text">Star this Repo</span>
      </a>
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
  const gettingStartedPage = tracks[0]?.pages[2]
  const aboutPage = tracks[4]?.pages[4]
  return `
    <footer class="footer">
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
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')

  function toggleSidebar() {
    sidebar?.classList.toggle('open')
    overlay?.classList.toggle('visible')
  }

  hamburger?.addEventListener('click', toggleSidebar)
  overlay?.addEventListener('click', toggleSidebar)

  // Search
  initSearch()
  const searchTrigger = document.getElementById('search-trigger')
  searchTrigger?.addEventListener('click', openSearch)
}

buildShell()
initAnalytics()
