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

  it('formats contextual badge states without using approval language', () => {
    expect(statusLabel('ready')).toBe('Ready')
    expect(statusLabel('blocked')).toBe('Blocked')
    expect(statusLabel('complete')).toBe('Complete')
    expect(statusLabel('configured')).toBe('Configured')
    expect(statusLabel('missing')).toBe('Missing')
  })
})

describe('statusVariant', () => {
  it('maps workflow states to visual variants', () => {
    expect(statusVariant('approved')).toBe('success')
    expect(statusVariant('qa_failed')).toBe('destructive')
    expect(statusVariant('needs_review')).toBe('warning')
    expect(statusVariant('profile_ready')).toBe('default')
  })

  it('uses neutral variants for empty or false states', () => {
    expect(statusVariant(false)).toBe('secondary')
    expect(statusVariant(undefined)).toBe('secondary')
  })

  it('maps contextual badge states to shadcn variants', () => {
    expect(statusVariant('ready')).toBe('success')
    expect(statusVariant('complete')).toBe('success')
    expect(statusVariant('blocked')).toBe('secondary')
    expect(statusVariant('missing')).toBe('secondary')
  })
})
