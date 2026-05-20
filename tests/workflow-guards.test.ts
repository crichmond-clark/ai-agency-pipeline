import { describe, expect, it } from 'vitest'

import { getApprovalBlockReason, getOutreachReviewBlockReason, getSendBlockReason } from '../lib/workflow-guards'

const now = new Date('2026-05-18T12:00:00.000Z')
const lead = { id: 1, pipeline_status: 'approved', sales_status: 'not_contacted', email: 'owner@example.com' }
const demoSite = { id: 2, lead: 1, is_public: true, qa_report: { status: 'passed' } }
const outreach = { id: 3, lead: 1, demo_site: 2, status: 'reviewed' }

describe('approval guard', () => {
  it('requires needs_review status', () => {
    expect(getApprovalBlockReason({ lead, demoSite, now })).toBe('Lead must be in needs_review before approval')
  })

  it('requires a passing QA report', () => {
    expect(getApprovalBlockReason({ lead: { ...lead, pipeline_status: 'needs_review' }, demoSite: { ...demoSite, qa_report: { status: 'failed' } }, now })).toBe('Demo site must have a passing QA report')
  })

  it('requires an available demo site', () => {
    expect(getApprovalBlockReason({ lead: { ...lead, pipeline_status: 'needs_review' }, demoSite: { ...demoSite, expires_at: '2026-05-18T11:00:00.000Z' }, now })).toBe('Demo site has expired')
  })

  it('allows valid approval', () => {
    expect(getApprovalBlockReason({ lead: { ...lead, pipeline_status: 'needs_review' }, demoSite, now })).toBeNull()
  })
})

describe('outreach review guard', () => {
  it('requires approved lead', () => {
    expect(getOutreachReviewBlockReason({ lead: { ...lead, pipeline_status: 'needs_review' }, demoSite, outreach: { ...outreach, status: 'draft' }, now })).toBe('Lead must be approved')
  })

  it('blocks do-not-contact leads', () => {
    expect(getOutreachReviewBlockReason({ lead: { ...lead, do_not_contact_at: '2026-05-01T00:00:00.000Z' }, demoSite, outreach: { ...outreach, status: 'draft' }, now })).toBe('Lead is marked do not contact')
  })

  it('requires a draft outreach message', () => {
    expect(getOutreachReviewBlockReason({ lead, demoSite, outreach, now })).toBe('Outreach message must be a draft')
  })

  it('checks relationships', () => {
    expect(getOutreachReviewBlockReason({ lead, demoSite, outreach: { ...outreach, status: 'draft', demo_site: 99 }, now })).toBe('Outreach message must belong to the active demo site')
  })

  it('allows valid review', () => {
    expect(getOutreachReviewBlockReason({ lead, demoSite, outreach: { ...outreach, status: 'draft' }, now })).toBeNull()
  })
})

describe('send guard', () => {
  it('blocks portfolio mode', () => {
    expect(getSendBlockReason({ lead, outreach, demoSite, portfolioMode: true, now })).toBe('Sending is disabled in portfolio mode')
  })

  it('blocks already contacted leads', () => {
    expect(getSendBlockReason({ lead: { ...lead, sales_status: 'contacted' }, outreach, demoSite, portfolioMode: false, now })).toBe('Lead has already been contacted')
  })

  it('blocks unreviewed outreach', () => {
    expect(getSendBlockReason({ lead, outreach: { ...outreach, status: 'draft' }, demoSite, portfolioMode: false, now })).toBe('Outreach message must be reviewed before sending')
  })

  it('blocks expired demo sites', () => {
    expect(getSendBlockReason({ lead, outreach, demoSite: { ...demoSite, expires_at: '2026-05-18T11:00:00.000Z' }, portfolioMode: false, now })).toBe('Demo site has expired')
  })

  it('blocks wrong relationships', () => {
    expect(getSendBlockReason({ lead, outreach: { ...outreach, lead: 99 }, demoSite, portfolioMode: false, now })).toBe('Outreach message must belong to the lead')
  })

  it('allows valid send', () => {
    expect(getSendBlockReason({ lead, outreach, demoSite, portfolioMode: false, now })).toBeNull()
  })
})
