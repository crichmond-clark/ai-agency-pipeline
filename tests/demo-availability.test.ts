import { describe, expect, it } from 'vitest'

import { getDemoAvailabilityBlockReason, isDemoSiteAvailable } from '../lib/demo-availability'

const now = new Date('2026-05-18T12:00:00.000Z')

describe('demo availability', () => {
  it('allows public demos without expiry', () => {
    expect(isDemoSiteAvailable({ is_public: true }, now)).toBe(true)
  })

  it('blocks private demos', () => {
    expect(getDemoAvailabilityBlockReason({ is_public: false }, now)).toBe('Demo site is not public')
  })

  it('blocks removed demos', () => {
    expect(getDemoAvailabilityBlockReason({ is_public: true, removed_at: '2026-05-01T00:00:00.000Z' }, now)).toBe('Demo site has been removed')
  })

  it('blocks expired demos', () => {
    expect(getDemoAvailabilityBlockReason({ is_public: true, expires_at: '2026-05-18T11:59:59.000Z' }, now)).toBe('Demo site has expired')
  })

  it('allows future expiry', () => {
    expect(isDemoSiteAvailable({ is_public: true, expires_at: '2026-05-18T12:00:01.000Z' }, now)).toBe(true)
  })

  it('fails closed on invalid expiry', () => {
    expect(getDemoAvailabilityBlockReason({ is_public: true, expires_at: 'not-a-date' }, now)).toBe('Demo site has expired')
  })
})
