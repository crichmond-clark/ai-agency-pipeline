import { describe, expect, it } from 'vitest'

import { resolveDemoTheme, toDemoThemeStyle } from '@/lib/demo-theme'

describe('resolveDemoTheme', () => {
  it('uses trade defaults when no theme is supplied', () => {
    const theme = resolveDemoTheme(undefined)

    expect(theme.preset).toBe('trade_navy_lime')
    expect(theme.primary).toBe('#14231c')
    expect(theme.accent).toBe('#f0b429')
    expect(theme.buttonStyle).toBe('square')
  })

  it('accepts safe hex overrides and style tokens', () => {
    const theme = resolveDemoTheme({
      preset: 'clean_blue',
      primary: '#123456',
      accent: '#abcdef',
      button_style: 'pill',
      section_density: 'spacious',
      hero_style: 'editorial',
    })

    expect(theme.preset).toBe('clean_blue')
    expect(theme.primary).toBe('#123456')
    expect(theme.accent).toBe('#abcdef')
    expect(theme.buttonStyle).toBe('pill')
    expect(theme.sectionDensity).toBe('spacious')
    expect(theme.heroStyle).toBe('editorial')
  })

  it('falls back for invalid values', () => {
    const theme = resolveDemoTheme({
      preset: 'unknown',
      primary: 'blue',
      accent: '#fff',
      button_style: 'rounded-2xl',
      section_density: 'huge',
      hero_style: 'javascript',
    })

    expect(theme.preset).toBe('trade_navy_lime')
    expect(theme.primary).toBe('#14231c')
    expect(theme.accent).toBe('#f0b429')
    expect(theme.buttonStyle).toBe('square')
    expect(theme.sectionDensity).toBe('standard')
    expect(theme.heroStyle).toBe('full_bleed')
  })

  it('emits scoped CSS variable styles', () => {
    const theme = resolveDemoTheme({ primary: '#ffffff', accent: '#000000' })
    const style = toDemoThemeStyle(theme) as Record<string, string>

    expect(style['--demo-primary']).toBe('#ffffff')
    expect(style['--demo-on-primary']).toBe('#111827')
    expect(style['--demo-accent']).toBe('#000000')
    expect(style['--demo-on-accent']).toBe('#ffffff')
  })
})
