import type { CSSProperties } from 'react'

export type DemoThemePreset = 'trade_navy_lime' | 'heritage_green_gold' | 'clean_blue' | 'premium_charcoal' | 'warm_builder'

export type DemoButtonStyle = 'square' | 'softened' | 'pill'
export type DemoSectionDensity = 'compact' | 'standard' | 'spacious'
export type DemoHeroStyle = 'split' | 'full_bleed' | 'editorial'

export type DemoThemeInput = {
  preset?: DemoThemePreset | string
  primary?: string
  accent?: string
  background?: string
  surface?: string
  text?: string
  muted?: string
  border?: string
  button_style?: DemoButtonStyle | string
  section_density?: DemoSectionDensity | string
  hero_style?: DemoHeroStyle | string
}

export type ResolvedDemoTheme = {
  preset: DemoThemePreset
  primary: string
  primaryStrong: string
  onPrimary: string
  accent: string
  onAccent: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
  heroOverlay: string
  buttonStyle: DemoButtonStyle
  sectionDensity: DemoSectionDensity
  heroStyle: DemoHeroStyle
}

type ThemePresetDefinition = Omit<ResolvedDemoTheme, 'preset' | 'buttonStyle' | 'sectionDensity' | 'heroStyle'>

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

const themePresets: Record<DemoThemePreset, ThemePresetDefinition> = {
  trade_navy_lime: {
    primary: '#14231c',
    primaryStrong: '#0b2240',
    onPrimary: '#ffffff',
    accent: '#f0b429',
    onAccent: '#14231c',
    background: '#f7f1e8',
    surface: '#fffaf0',
    text: '#17211b',
    muted: '#4d594f',
    border: '#d4c4aa',
    heroOverlay: 'rgba(20, 35, 28, 0.76)',
  },
  heritage_green_gold: {
    primary: '#15372f',
    primaryStrong: '#0d261f',
    onPrimary: '#ffffff',
    accent: '#d6a534',
    onAccent: '#13231d',
    background: '#f6f0e4',
    surface: '#fffaf0',
    text: '#17211b',
    muted: '#556156',
    border: '#d8c8ad',
    heroOverlay: 'rgba(21, 55, 47, 0.76)',
  },
  clean_blue: {
    primary: '#123f63',
    primaryStrong: '#082f49',
    onPrimary: '#ffffff',
    accent: '#38bdf8',
    onAccent: '#082f49',
    background: '#f4f8fb',
    surface: '#ffffff',
    text: '#102235',
    muted: '#4b6074',
    border: '#c9d8e4',
    heroOverlay: 'rgba(8, 47, 73, 0.74)',
  },
  premium_charcoal: {
    primary: '#22201d',
    primaryStrong: '#12110f',
    onPrimary: '#ffffff',
    accent: '#c89f5d',
    onAccent: '#171512',
    background: '#f3efe8',
    surface: '#fffaf2',
    text: '#211f1c',
    muted: '#5f5a52',
    border: '#d5c9b7',
    heroOverlay: 'rgba(18, 17, 15, 0.76)',
  },
  warm_builder: {
    primary: '#4a2617',
    primaryStrong: '#2f160c',
    onPrimary: '#ffffff',
    accent: '#e07a2f',
    onAccent: '#2f160c',
    background: '#fbf1e8',
    surface: '#fff8ef',
    text: '#2b211a',
    muted: '#674f40',
    border: '#dfc6ad',
    heroOverlay: 'rgba(74, 38, 23, 0.74)',
  },
}

export function resolveDemoTheme(input: DemoThemeInput | null | undefined): ResolvedDemoTheme {
  const preset = isDemoThemePreset(input?.preset) ? input.preset : 'trade_navy_lime'
  const defaults = themePresets[preset]
  const primary = safeHex(input?.primary, defaults.primary)
  const accent = safeHex(input?.accent, defaults.accent)
  const background = safeHex(input?.background, defaults.background)
  const surface = safeHex(input?.surface, defaults.surface)
  const text = safeHex(input?.text, defaults.text)
  const muted = safeHex(input?.muted, defaults.muted)
  const border = safeHex(input?.border, defaults.border)

  return {
    preset,
    primary,
    primaryStrong: defaults.primaryStrong,
    onPrimary: readableOn(primary),
    accent,
    onAccent: readableOn(accent),
    background,
    surface,
    text,
    muted,
    border,
    heroOverlay: defaults.heroOverlay,
    buttonStyle: isButtonStyle(input?.button_style) ? input.button_style : 'square',
    sectionDensity: isSectionDensity(input?.section_density) ? input.section_density : 'standard',
    heroStyle: isHeroStyle(input?.hero_style) ? input.hero_style : 'full_bleed',
  }
}

export function toDemoThemeStyle(theme: ResolvedDemoTheme): CSSProperties {
  return {
    '--demo-bg': theme.background,
    '--demo-surface': theme.surface,
    '--demo-text': theme.text,
    '--demo-muted': theme.muted,
    '--demo-primary': theme.primary,
    '--demo-primary-strong': theme.primaryStrong,
    '--demo-on-primary': theme.onPrimary,
    '--demo-accent': theme.accent,
    '--demo-on-accent': theme.onAccent,
    '--demo-border': theme.border,
    '--demo-hero-overlay': theme.heroOverlay,
  } as CSSProperties
}

function safeHex(value: string | undefined, fallback: string): string {
  return value && HEX_COLOR.test(value) ? value : fallback
}

function isDemoThemePreset(value: string | undefined): value is DemoThemePreset {
  return value === 'trade_navy_lime' || value === 'heritage_green_gold' || value === 'clean_blue' || value === 'premium_charcoal' || value === 'warm_builder'
}

function isButtonStyle(value: string | undefined): value is DemoButtonStyle {
  return value === 'square' || value === 'softened' || value === 'pill'
}

function isSectionDensity(value: string | undefined): value is DemoSectionDensity {
  return value === 'compact' || value === 'standard' || value === 'spacious'
}

function isHeroStyle(value: string | undefined): value is DemoHeroStyle {
  return value === 'split' || value === 'full_bleed' || value === 'editorial'
}

function readableOn(hex: string): '#ffffff' | '#111827' {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance > 0.58 ? '#111827' : '#ffffff'
}
