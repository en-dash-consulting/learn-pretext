export interface ToggleOptions {
  label: string
  active?: boolean
  onChange: (active: boolean) => void
}

export function createToggle(container: HTMLElement, options: ToggleOptions): {
  setActive: (active: boolean) => void
  element: HTMLElement
} {
  const { label, active = false, onChange } = options

  const el = document.createElement('div')
  el.className = `toggle${active ? ' active' : ''}`
  el.setAttribute('role', 'switch')
  el.setAttribute('aria-checked', String(active))
  el.setAttribute('aria-label', label)
  el.tabIndex = 0
  el.innerHTML = `
    <div class="toggle__track">
      <div class="toggle__thumb"></div>
    </div>
    <span>${label}</span>
  `

  function toggle() {
    const isActive = !el.classList.contains('active')
    el.classList.toggle('active', isActive)
    el.setAttribute('aria-checked', String(isActive))
    onChange(isActive)
  }

  el.addEventListener('click', toggle)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  })

  container.appendChild(el)

  return {
    setActive(a: boolean) {
      el.classList.toggle('active', a)
      el.setAttribute('aria-checked', String(a))
    },
    element: el,
  }
}
