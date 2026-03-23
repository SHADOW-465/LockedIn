// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { THEMES, applyTheme } from '@/lib/themes'

describe('THEMES', () => {
  it('exports exactly 6 themes', () => {
    expect(Object.keys(THEMES)).toHaveLength(6)
  })

  it('each theme has required CSS var keys', () => {
    for (const theme of Object.values(THEMES)) {
      expect(theme).toHaveProperty('accent')
      expect(theme).toHaveProperty('accentDark')
      expect(theme).toHaveProperty('accentDim')
      expect(theme).toHaveProperty('accentGlow')
      expect(theme).toHaveProperty('label')
    }
  })

  it('crimson is the default theme', () => {
    expect(THEMES['crimson'].accent).toBe('#ef4444')
  })
})

describe('applyTheme', () => {
  it('sets CSS custom properties on the provided element', () => {
    const el = document.createElement('div')
    applyTheme('amethyst', el)
    expect(el.style.getPropertyValue('--accent')).toBe(THEMES['amethyst'].accent)
    expect(el.style.getPropertyValue('--accent-dark')).toBe(THEMES['amethyst'].accentDark)
  })

  it('falls back to crimson for unknown theme names', () => {
    const el = document.createElement('div')
    applyTheme('nonexistent', el)
    expect(el.style.getPropertyValue('--accent')).toBe(THEMES['crimson'].accent)
  })
})
