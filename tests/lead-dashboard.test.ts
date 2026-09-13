import { describe, expect, it } from 'vitest'

import { buildLeadFilters, formatDashboardStatus, hasActiveDashboardFilters, indexLatestByLead, leadDashboardHref, parseDashboardPage, statusBadgeVariant } from '../lib/lead-dashboard'

describe('Lead dashboard presentation helpers', () => {
  it('accepts positive integer pages and defaults invalid values to page one', () => {
    expect(parseDashboardPage('3')).toBe(3)
    expect(parseDashboardPage('0')).toBe(1)
    expect(parseDashboardPage('2.5')).toBe(1)
    expect(parseDashboardPage('invalid')).toBe(1)
  })

  it('builds filters only from allowlisted values', () => {
    expect(buildLeadFilters({ pipeline_status: 'approved', sales_status: 'contacted', demo_creation_approved: 'yes' })).toEqual({ and: [{ pipeline_status: { equals: 'approved' } }, { sales_status: { equals: 'contacted' } }, { demo_creation_approved_at: { exists: true } }] })
    expect(buildLeadFilters({ pipeline_status: 'unexpected', sales_status: 'invalid', demo_creation_approved: 'maybe' })).toBeUndefined()
  })

  it('preserves valid filters in pagination links and drops invalid values', () => {
    expect(leadDashboardHref({ pipeline_status: 'needs_review', sales_status: 'invalid' }, 2)).toBe('/dashboard/leads?pipeline_status=needs_review&page=2')
  })

  it('humanizes statuses and chooses semantic badge variants', () => {
    expect(formatDashboardStatus('demo_content_ready')).toBe('Demo Content Ready')
    expect(statusBadgeVariant('approved')).toBe('success')
    expect(statusBadgeVariant('qa_failed')).toBe('destructive')
    expect(statusBadgeVariant('needs_review')).toBe('warning')
  })

  it('recognizes active filters only when a value is valid', () => {
    expect(hasActiveDashboardFilters({ pipeline_status: 'approved' })).toBe(true)
    expect(hasActiveDashboardFilters({ pipeline_status: 'invalid' })).toBe(false)
  })

  it('indexes the first newest-sorted related record for each Lead', () => {
    const newest = { id: 3, lead: 10, started_at: '2026-09-13T12:00:00Z' }
    const older = { id: 2, lead: { id: 10 }, started_at: '2026-09-12T12:00:00Z' }
    const other = { id: 1, lead: '11', started_at: '2026-09-11T12:00:00Z' }

    const result = indexLatestByLead<{ id: number; lead?: unknown; started_at?: string }>([newest, older, other, { id: 4 }])

    expect(result.get('10')).toBe(newest)
    expect(result.get('11')).toBe(other)
    expect(result.size).toBe(2)
  })
})
