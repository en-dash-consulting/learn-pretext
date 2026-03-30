import { codeToHtml } from 'shiki'

export interface SourceViewerOptions {
  code: string
  language?: string
  title?: string
  startOpen?: boolean
  highlightLines?: number[]
}

export async function createSourceViewer(
  container: HTMLElement,
  options: SourceViewerOptions,
): Promise<void> {
  const {
    code,
    language = 'typescript',
    title = 'Source Code',
    startOpen = false,
  } = options

  const html = await codeToHtml(code.trim(), {
    lang: language,
    theme: 'github-dark-default',
  })

  const wrapper = document.createElement('div')
  wrapper.className = `source-viewer${startOpen ? ' open' : ''}`
  wrapper.innerHTML = `
    <div class="source-viewer__header" role="button" tabindex="0" aria-expanded="${startOpen}">
      <span class="source-viewer__title">
        <span class="source-viewer__toggle">&#9660;</span>
        ${title}
      </span>
      <button class="source-viewer__copy" aria-label="Copy code">Copy</button>
    </div>
    <div class="source-viewer__body">${html}</div>
  `

  const header = wrapper.querySelector('.source-viewer__header')!
  const copyBtn = wrapper.querySelector('.source-viewer__copy') as HTMLButtonElement

  function toggle() {
    wrapper.classList.toggle('open')
    header.setAttribute('aria-expanded', String(wrapper.classList.contains('open')))
  }

  header.addEventListener('click', (e) => {
    if (e.target === copyBtn) return
    toggle()
  })
  header.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
      e.preventDefault()
      toggle()
    }
  })

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(code.trim())
    copyBtn.textContent = 'Copied!'
    setTimeout(() => { copyBtn.textContent = 'Copy' }, 2000)
  })

  container.appendChild(wrapper)
}
