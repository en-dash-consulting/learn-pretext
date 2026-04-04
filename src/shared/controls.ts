/**
 * Global controls — a horizontal bar at the bottom of the viewport.
 * No gear icon. Always present. Part of the experience.
 */

export type InteractionMode = 'calm' | 'scared' | 'magnify'

export interface ControlState {
  theme: 'dark' | 'light'
  inverted: boolean
  textScale: number
  mode: InteractionMode
}

const STORAGE_KEY = 'learn-pretext-controls'

let state: ControlState = {
  theme: 'dark',
  inverted: false,
  textScale: 1,
  mode: 'scared',
}

const listeners: Array<(s: ControlState) => void> = []

export function getControlState(): ControlState {
  return state
}

export function onControlChange(fn: (s: ControlState) => void) {
  listeners.push(fn)
}

function notify() {
  for (const fn of listeners) fn({ ...state })
  applyToPage()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function applyToPage() {
  const root = document.documentElement
  root.setAttribute('data-theme', state.theme)
  // Scale all content text
  root.style.setProperty('--text-scale', String(state.textScale))
  // Flip state for CSS
  root.setAttribute('data-flipped', String(state.inverted))
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      state = { ...state, ...parsed }
    }
  } catch {}
  if (!localStorage.getItem(STORAGE_KEY)) {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      state.theme = 'light'
    }
  }
}

const ICONS = {
  sun: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  flip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  calm: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 12h8"/></svg>`,
  scatter: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  magnify: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
}

export function buildControls(): string {
  return `
    <div class="controlbar" id="controlbar">
      <button class="controlbar__btn" id="ctrl-theme" aria-label="Toggle theme" title="Toggle theme">
        <span id="ctrl-theme-icon">${state.theme === 'dark' ? ICONS.moon : ICONS.sun}</span>
      </button>
      <button class="controlbar__btn" id="ctrl-flip" aria-label="Flip text" title="Flip text">
        ${ICONS.flip}
      </button>
      <div class="controlbar__sep"></div>
      <span class="controlbar__label">A</span>
      <input type="range" class="controlbar__slider" id="ctrl-size" min="0.65" max="1.6" step="0.05" value="${state.textScale}" aria-label="Text size" />
      <span class="controlbar__label controlbar__label--lg">A</span>
      <div class="controlbar__sep"></div>
      <div class="controlbar__modes" id="ctrl-modes">
        <button class="controlbar__mode${state.mode === 'calm' ? ' active' : ''}" data-mode="calm" title="Calm">${ICONS.calm}</button>
        <button class="controlbar__mode${state.mode === 'scared' ? ' active' : ''}" data-mode="scared" title="Scatter">${ICONS.scatter}</button>
        <button class="controlbar__mode${state.mode === 'magnify' ? ' active' : ''}" data-mode="magnify" title="Magnify">${ICONS.magnify}</button>
      </div>
    </div>
  `
}

export function initControls() {
  loadState()
  applyToPage()

  // Theme
  const themeBtn = document.getElementById('ctrl-theme')
  const themeIcon = document.getElementById('ctrl-theme-icon')
  themeBtn?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark'
    if (themeIcon) themeIcon.innerHTML = state.theme === 'dark' ? ICONS.moon : ICONS.sun
    notify()
  })

  // Flip
  const flipBtn = document.getElementById('ctrl-flip')
  flipBtn?.classList.toggle('active', state.inverted)
  flipBtn?.addEventListener('click', () => {
    state.inverted = !state.inverted
    flipBtn.classList.toggle('active', state.inverted)
    notify()
  })

  // Size
  const sizeSlider = document.getElementById('ctrl-size') as HTMLInputElement
  if (sizeSlider) {
    sizeSlider.value = String(state.textScale)
    sizeSlider.addEventListener('input', () => {
      state.textScale = parseFloat(sizeSlider.value)
      notify()
    })
  }

  // Modes
  const modesContainer = document.getElementById('ctrl-modes')
  modesContainer?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-mode]') as HTMLElement
    if (!btn) return
    state.mode = btn.dataset.mode as InteractionMode
    modesContainer.querySelectorAll('.controlbar__mode').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    notify()
  })

  // Scroll-driven dock: shrinks after scrolling a little
  const bar = document.getElementById('controlbar')
  if (bar) {
    const barEl = bar
    let docked = false
    const threshold = 120
    function checkDock() {
      const shouldDock = window.scrollY > threshold
      if (shouldDock !== docked) {
        docked = shouldDock
        barEl.classList.toggle('docked', docked)
      }
    }
    window.addEventListener('scroll', checkDock, { passive: true })
    checkDock()
  }

  // Fire initial state
  notify()
}
