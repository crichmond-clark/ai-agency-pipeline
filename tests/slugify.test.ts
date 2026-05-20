import { describe, expect, it } from 'vitest'

import { demoSlugForLead, slugify } from '../lib/slugify'

describe('slugify', () => {
  it('normalises text for URLs', () => {
    expect(slugify('  A&B Roofing Ltd!  ')).toBe('a-and-b-roofing-ltd')
  })

  it('strips leading and trailing separators', () => {
    expect(slugify('---Hello---World---')).toBe('hello-world')
  })

  it('falls back to demo for empty lead names', () => {
    expect(demoSlugForLead({ id: 123456 })).toBe('demo-123456')
  })

  it('includes a stable id suffix', () => {
    expect(demoSlugForLead({ business_name: 'A&B Roofing', city: 'Leeds', id: 987654 })).toBe('a-and-b-roofing-leeds-987654')
  })
})
