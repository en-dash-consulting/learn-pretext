export interface PerfEntry {
  label: string
  value: number
  slow?: boolean
}

export function createPerfMeter(container: HTMLElement): {
  update: (entries: PerfEntry[]) => void
  element: HTMLElement
} {
  const el = document.createElement('div')
  el.className = 'perf-meter'
  el.setAttribute('aria-live', 'polite')
  container.appendChild(el)

  function update(entries: PerfEntry[]) {
    el.innerHTML = entries.map((entry, i) => `
      ${i > 0 ? '<span class="perf-meter__divider"></span>' : ''}
      <span class="perf-meter__item">
        <span class="perf-meter__label">${entry.label}</span>
        <span class="perf-meter__value${entry.slow ? ' perf-meter__value--slow' : ''}">
          ${formatTime(entry.value)}
        </span>
      </span>
    `).join('')
  }

  return { update, element: el }
}

function formatTime(ms: number): string {
  if (ms < 0.01) return '<0.01ms'
  if (ms < 1) return `${ms.toFixed(2)}ms`
  if (ms < 100) return `${ms.toFixed(1)}ms`
  return `${Math.round(ms)}ms`
}
