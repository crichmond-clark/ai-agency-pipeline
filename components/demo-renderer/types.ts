import type { DemoThemeInput, ResolvedDemoTheme } from '@/lib/demo-theme'
import type { DemoContentPayload } from '@/types/ai'

export type HomeServicesVariant = 'contractor_classic' | 'emergency_first' | 'premium_local' | 'clean_modern'

export type DemoSectionKey =
  | 'header'
  | 'hero'
  | 'services'
  | 'trust'
  | 'process'
  | 'cta'
  | 'footer'

export type DemoTemplateManifest = {
  key: HomeServicesVariant
  label: string
  sections: DemoSectionKey[]
}

export type DemoServiceItem = {
  title: string
  description: string
}

export type DemoProcessStep = {
  title: string
  body: string
}

export type NormalizedHomeServicesContent = {
  variant: HomeServicesVariant
  themeInput?: DemoThemeInput
  businessName: string
  city?: string
  phone?: string
  email?: string
  contactHref: string
  secondaryContactHref: string
  serviceArea: string
  serviceAreaLabel: string
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    primaryCta: string
    secondaryCta: string
  }
  services: DemoServiceItem[]
  trustReasons: string[]
  processSteps: DemoProcessStep[]
  contactCta: {
    headline: string
    body: string
    buttonLabel: string
  }
  footerDisclaimer: string
}

export type DemoSectionProps = {
  content: NormalizedHomeServicesContent
  theme: ResolvedDemoTheme
}

export type HomeServicesTemplateProps = {
  businessName: string
  city?: string
  phone?: string
  email?: string
  content: DemoContentPayload
}
