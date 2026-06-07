import { describe, expect, it } from 'vitest'

import { getHomeServicesManifest } from '@/components/demo-templates/home-services-manifests'
import { normalizeHomeServicesContent } from '@/lib/demo-content-normalizer'
import type { DemoContentPayload } from '@/types/ai'

const baseContent: DemoContentPayload = {
  hero: {
    eyebrow: 'Local plumbing help',
    headline: 'Reliable plumbing support in Plymouth',
    subheadline: 'Call to discuss repairs, maintenance, and next steps.',
    cta: 'Request help',
  },
  services: [{ title: 'Leak repairs', description: 'Discuss leaks, repairs, and practical next steps.' }],
  why_choose_us: ['Clear service information before customers call'],
  service_area: 'Serving Plymouth and nearby areas.',
  contact_cta: {
    headline: 'Need help with plumbing?',
    body: 'Call or send an enquiry with the service needed.',
    button_label: 'Send enquiry',
  },
  footer_disclaimer: 'Unofficial demonstration page for review purposes only.',
}

describe('normalizeHomeServicesContent', () => {
  it('keeps safe content and normalizes contact links', () => {
    const content = normalizeHomeServicesContent({
      businessName: 'Plymouth Plumbing',
      city: 'Plymouth',
      phone: '01752 123456',
      email: 'hello@example.com',
      content: baseContent,
    })

    expect(content.variant).toBe('contractor_classic')
    expect(content.contactHref).toBe('tel:01752 123456')
    expect(content.secondaryContactHref).toBe('mailto:hello@example.com')
    expect(content.serviceAreaLabel).toBe('Serving Plymouth and nearby areas')
    expect(content.hero.headline).toBe('Reliable plumbing support in Plymouth')
  })

  it('falls back from old internal/demo-facing copy', () => {
    const content = normalizeHomeServicesContent({
      businessName: 'Plymouth Plumbing',
      city: 'Plymouth',
      content: {
        ...baseContent,
        hero: {
          ...baseContent.hero,
          eyebrow: 'Concept homepage mockup',
          headline: 'A generated website concept for Plymouth Plumbing',
        },
        services: [{ title: 'Website service information', description: 'Generated layout copy for the page.' }],
      },
    })

    expect(content.hero.eyebrow).toBe('Local home services')
    expect(content.hero.headline).toBe('Reliable local help in Plymouth')
    expect(content.services[0]?.title).toBe('Local services')
    expect(content.services[0]?.description).toContain('properties in Plymouth')
  })

  it('keeps whitelisted variants and falls back for unknown variants', () => {
    expect(normalizeHomeServicesContent({ businessName: 'A', content: { ...baseContent, variant_key: 'premium_local' } }).variant).toBe('premium_local')
    expect(normalizeHomeServicesContent({ businessName: 'A', content: { ...baseContent, variant_key: undefined } }).variant).toBe('contractor_classic')
  })
})

describe('home services manifests', () => {
  it('defines a reviewed section order for each variant', () => {
    expect(getHomeServicesManifest('contractor_classic').sections).toEqual(['header', 'hero', 'services', 'trust', 'process', 'cta', 'footer'])
    expect(getHomeServicesManifest('emergency_first').sections[0]).toBe('header')
  })
})
