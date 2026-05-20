import { describe, expect, it } from 'vitest'

import { statusLabel, statusVariant } from './status'

describe('statusLabel', () => {
  it('formats known statuses', () => {
    expect(statusLabel('profile_ready')).toBe('Profile ready')
    expect(statusLabel('not_contacted')).toBe('Not contacted')
  })

  it('formats booleans and unknown values safely', () => {
    expect(statusLabel(true)).toBe('Approved')
    expect(statusLabel(false)).toBe('Not approved')
    expect(statusLabel('custom_status')).toBe('custom status')
  })
})

describe('statusVariant', () => {
  it('maps workflow states to visual variants', () => {
    expect(statusVariant('approved')).toBe('green')
    expect(statusVariant('qa_failed')).toBe('red')
    expect(statusVariant('needs_review')).toBe('amber')
    expect(statusVariant('profile_ready')).toBe('blue')
  })

  it('uses neutral variants for empty or false states', () => {
    expect(statusVariant(false)).toBe('neutral')
    expect(statusVariant(undefined)).toBe('neutral')
  })
})
