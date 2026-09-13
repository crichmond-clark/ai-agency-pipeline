import { describe, expect, it } from 'vitest'

import { formatReviewStatus, getReviewSteps } from '../lib/review-workflow'

describe('review workflow', () => {
  it('marks the first incomplete prerequisite as current', () => {
    const steps = getReviewSteps({ demoApproved: false, hasProfile: false, hasDemo: false, hasOutreach: false, doNotContact: false })
    expect(steps[0].state).toBe('current')
    expect(steps[1].state).toBe('blocked')
  })

  it('shows a passing QA lead at human review', () => {
    const steps = getReviewSteps({ demoApproved: true, hasProfile: true, hasDemo: true, qaStatus: 'passed', pipelineStatus: 'needs_review', hasOutreach: false, doNotContact: false })
    expect(steps.find((step) => step.key === 'review')?.state).toBe('current')
    expect(steps.find((step) => step.key === 'qa')?.state).toBe('complete')
  })

  it('blocks outreach and sending for do-not-contact leads', () => {
    const steps = getReviewSteps({ demoApproved: true, hasProfile: true, hasDemo: true, qaStatus: 'passed', pipelineStatus: 'approved', hasOutreach: false, doNotContact: true, salesStatus: 'not_contacted' })
    expect(steps.find((step) => step.key === 'outreach')?.state).toBe('blocked')
    expect(steps.find((step) => step.key === 'send')?.state).toBe('blocked')
  })

  it('only exposes sending as the current step for an approved reviewed draft', () => {
    const steps = getReviewSteps({ demoApproved: true, hasProfile: true, hasDemo: true, qaStatus: 'passed', pipelineStatus: 'approved', hasOutreach: true, outreachStatus: 'reviewed', doNotContact: false, salesStatus: 'not_contacted' })
    expect(steps.find((step) => step.key === 'outreach')?.state).toBe('complete')
    expect(steps.find((step) => step.key === 'send')?.state).toBe('current')
  })

  it('humanizes persisted statuses and handles missing values', () => {
    expect(formatReviewStatus('demo_content_ready')).toBe('Demo Content Ready')
    expect(formatReviewStatus(null)).toBe('Not available')
  })
})
