export const reviewSteps = [
  { key: 'demo-approval', label: 'Demo approval', description: 'Authorize generation' },
  { key: 'profile', label: 'Business Profile', description: 'Structure lead evidence' },
  { key: 'demo-content', label: 'Demo content', description: 'Prepare the concept' },
  { key: 'qa', label: 'Screenshots & QA', description: 'Check the rendered site' },
  { key: 'review', label: 'Human review', description: 'Approve or reject' },
  { key: 'outreach', label: 'Outreach Draft', description: 'Prepare a reviewed message' },
  { key: 'send', label: 'Send', description: 'Make an explicit contact attempt' },
] as const

export type ReviewStepKey = (typeof reviewSteps)[number]['key']
export type ReviewStepState = 'complete' | 'current' | 'blocked' | 'pending'

export type ReviewWorkflowInput = {
  demoApproved: boolean
  hasProfile: boolean
  hasDemo: boolean
  qaStatus?: string | null
  pipelineStatus?: string | null
  hasOutreach: boolean
  outreachStatus?: string | null
  doNotContact: boolean
  salesStatus?: string | null
}

export type ReviewStep = (typeof reviewSteps)[number] & { state: ReviewStepState }

export function getReviewSteps(input: ReviewWorkflowInput): ReviewStep[] {
  const states: Record<ReviewStepKey, ReviewStepState> = {
    'demo-approval': input.demoApproved ? 'complete' : 'current',
    profile: input.hasProfile ? 'complete' : input.demoApproved ? 'current' : 'blocked',
    'demo-content': input.hasDemo ? 'complete' : input.hasProfile ? 'current' : 'blocked',
    qa: input.qaStatus === 'passed' ? 'complete' : input.hasDemo ? input.qaStatus === 'failed' ? 'current' : 'current' : 'blocked',
    review: input.pipelineStatus === 'approved' ? 'complete' : input.pipelineStatus === 'rejected' ? 'current' : input.qaStatus === 'passed' ? 'current' : 'blocked',
    outreach: input.hasOutreach ? 'complete' : input.pipelineStatus === 'approved' && !input.doNotContact ? 'current' : input.doNotContact ? 'blocked' : 'pending',
    send: input.salesStatus && input.salesStatus !== 'not_contacted' ? 'complete' : input.outreachStatus === 'sent' ? 'complete' : input.outreachStatus === 'reviewed' && input.pipelineStatus === 'approved' && !input.doNotContact ? 'current' : input.doNotContact ? 'blocked' : 'pending',
  }
  return reviewSteps.map((step) => ({ ...step, state: states[step.key] }))
}

export function formatReviewStatus(value: string | null | undefined): string {
  if (!value) return 'Not available'
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
