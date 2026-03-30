import { prepare, layout } from '@chenglou/pretext'
import type { PreparedText } from '@chenglou/pretext'

export const FONT = '16px Inter'
export const LINE_HEIGHT = 24

export async function waitForFonts(): Promise<void> {
  await document.fonts.ready
}

export function prepareText(text: string, font = FONT): PreparedText {
  return prepare(text, font)
}

export function measureHeight(prepared: PreparedText, maxWidth: number, lineHeight = LINE_HEIGHT) {
  return layout(prepared, maxWidth, lineHeight)
}

export function timeExecution<T>(fn: () => T): { result: T; elapsed: number } {
  const start = performance.now()
  const result = fn()
  const elapsed = performance.now() - start
  return { result, elapsed }
}

export function onResize(el: HTMLElement, callback: (width: number) => void): ResizeObserver {
  const observer = new ResizeObserver(entries => {
    const entry = entries[0]
    if (entry) {
      callback(entry.contentRect.width)
    }
  })
  observer.observe(el)
  return observer
}
