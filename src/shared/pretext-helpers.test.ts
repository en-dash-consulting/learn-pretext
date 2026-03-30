import { describe, it, expect } from 'vitest'
import { FONT, LINE_HEIGHT, timeExecution } from './pretext-helpers'

describe('pretext-helpers', () => {
  it('exports correct font constant', () => {
    expect(FONT).toBe('16px Inter')
  })

  it('exports correct line height constant', () => {
    expect(LINE_HEIGHT).toBe(24)
  })

  it('timeExecution returns result and elapsed', () => {
    const { result, elapsed } = timeExecution(() => 42)
    expect(result).toBe(42)
    expect(typeof elapsed).toBe('number')
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })

  it('timeExecution measures non-trivial work', () => {
    const { elapsed } = timeExecution(() => {
      let sum = 0
      for (let i = 0; i < 100000; i++) sum += i
      return sum
    })
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })
})
