import { describe, expect, it } from 'vitest'

import { runDeterministicQa } from '../lib/qa'

const validContent = {
  hero: { eyebrow: 'Local services', headline: 'Reliable help', subheadline: 'A cleaner local website concept.', cta: 'Call today' },
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
})
