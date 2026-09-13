import { describe, expect, it } from 'vitest'

import { normalizeDatabaseUri } from '../lib/env'

describe('normalizeDatabaseUri', () => {
  it('makes legacy certificate-verifying modes explicit', () => {
    expect(normalizeDatabaseUri('postgres://user:pass@host/db?sslmode=require')).toBe('postgres://user:pass@host/db?sslmode=verify-full')
    expect(normalizeDatabaseUri('postgres://host/db?connect_timeout=5&sslmode=verify-ca')).toBe('postgres://host/db?connect_timeout=5&sslmode=verify-full')
  })

  it('preserves URLs without a legacy ssl mode', () => {
    const uri = 'postgres://host/db?sslmode=disable'
    expect(normalizeDatabaseUri(uri)).toBe(uri)
  })
})
