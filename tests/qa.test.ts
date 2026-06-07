import { describe, expect, it } from 'vitest'

import { runDeterministicQa } from '../lib/qa'

const validContent = {
  hero: { eyebrow: 'Local services', headline: 'Reliable help', subheadline: 'Call for local service support.', cta: 'Call today' },
  services: [{ title: 'Repairs', description: 'General home service repairs.' }],
  why_choose_us: ['Clear contact options'],
  service_area: 'Serving Leeds',
  contact_cta: { headline: 'Need help?', body: 'Get in touch for a quote.', button_label: 'Email us' },
  footer_disclaimer: 'Unofficial demonstration concept mockup.',
}

describe('deterministic QA', () => {
  it('passes valid public demo content', () => {
    expect(runDeterministicQa({ slug: 'demo', is_public: true, content: validContent }).status).toBe('passed')
  })

  it('fails invalid content', () => {
    expect(runDeterministicQa({ slug: 'demo', is_public: true, content: { ...validContent, services: [] } }).status).toBe('failed')
  })

  it('fails missing disclaimer wording', () => {
    expect(runDeterministicQa({ slug: 'demo', is_public: true, content: { ...validContent, footer_disclaimer: 'Concept only.' } }).status).toBe('failed')
  })

  it('fails private demos', () => {
    expect(runDeterministicQa({ slug: 'demo', is_public: false, content: validContent }).status).toBe('failed')
  })

  it('fails meta copy in customer-facing content', () => {
    const result = runDeterministicQa({
      slug: 'demo',
      is_public: true,
      content: { ...validContent, hero: { ...validContent.hero, subheadline: 'A generated website concept for local customers.' } },
    })

    expect(result.status).toBe('failed')
    expect(result.deterministic.find((check) => check.name === 'no_meta_demo_copy')?.passed).toBe(false)
  })

  it('does not treat demolition as demo meta copy', () => {
    const result = runDeterministicQa({
      slug: 'demo',
      is_public: true,
      content: { ...validContent, services: [{ title: 'Demolition', description: 'Small demolition and clearance enquiries.' }] },
    })

    expect(result.status).toBe('passed')
  })
})
