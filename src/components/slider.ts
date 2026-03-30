export interface SliderOptions {
  label: string
  min: number
  max: number
  value: number
  step?: number
  formatValue?: (v: number) => string
  onChange: (v: number) => void
}

export function createSlider(container: HTMLElement, options: SliderOptions): {
  setValue: (v: number) => void
  element: HTMLElement
} {
  const { label, min, max, value, step = 1, formatValue = (v) => `${v}`, onChange } = options

  const el = document.createElement('div')
  el.className = 'slider'
  el.innerHTML = `
    <div class="slider__header">
      <label class="slider__label">${label}</label>
      <span class="slider__value">${formatValue(value)}</span>
    </div>
    <input type="range" min="${min}" max="${max}" value="${value}" step="${step}" aria-label="${label}">
  `

  const input = el.querySelector('input')!
  const valueDisplay = el.querySelector('.slider__value')!

  input.addEventListener('input', () => {
    const v = Number(input.value)
    valueDisplay.textContent = formatValue(v)
    onChange(v)
  })

  container.appendChild(el)

  return {
    setValue(v: number) {
      input.value = String(v)
      valueDisplay.textContent = formatValue(v)
    },
    element: el,
  }
}
