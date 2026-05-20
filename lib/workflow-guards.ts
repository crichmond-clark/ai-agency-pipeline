import { getDemoAvailabilityBlockReason, type DemoAvailabilityFields } from './demo-availability'

export type LeadWorkflowFields = {
  id?: string | number | null
  pipeline_status?: string | null
  sales_status?: string | null
  do_not_contact_at?: string | null
  email?: string | null
}

export type DemoSiteWorkflowFields = DemoAvailabilityFields & {
  id?: string | number | null
  lead?: string | number | { id?: string | number | null } | null
  qa_report?: unknown
}

export type OutreachWorkflowFields = {
  id?: string | number | null
  lead?: string | number | { id?: string | number | null } | null
  demo_site?: string | number | { id?: string | number | null } | null
  status?: string | null
  sent_at?: string | null
}

export function getApprovalBlockReason({ lead, demoSite, now = new Date() }: { lead: LeadWorkflowFields; demoSite: DemoSiteWorkflowFields | null | undefined; now?: Date }): string | null {
  if (lead.pipeline_status !== 'needs_review') return 'Lead must be in needs_review before approval'
  const availabilityBlock = getDemoAvailabilityBlockReason(demoSite, now)
  if (availabilityBlock) return availabilityBlock
  if (qaStatus(demoSite?.qa_report) !== 'passed') return 'Demo site must have a passing QA report'
  if (!sameRelatedId(demoSite?.lead, lead.id)) return 'Demo site must belong to the lead'
  return null
}

export function getOutreachReviewBlockReason({ lead, demoSite, outreach, now = new Date() }: { lead: LeadWorkflowFields; demoSite: DemoSiteWorkflowFields | null | undefined; outreach: OutreachWorkflowFields; now?: Date }): string | null {
  if (lead.pipeline_status !== 'approved') return 'Lead must be approved'
  if (lead.do_not_contact_at) return 'Lead is marked do not contact'
  const availabilityBlock = getDemoAvailabilityBlockReason(demoSite, now)
  if (availabilityBlock) return availabilityBlock
  if (outreach.status !== 'draft') return 'Outreach message must be a draft'
  if (!sameRelatedId(outreach.lead, lead.id)) return 'Outreach message must belong to the lead'
  if (!sameRelatedId(outreach.demo_site, demoSite?.id)) return 'Outreach message must belong to the active demo site'
  return null
}

export function getSendBlockReason({ lead, outreach, demoSite, now = new Date(), portfolioMode = process.env.PORTFOLIO_MODE === 'true' }: { lead: LeadWorkflowFields; outreach: OutreachWorkflowFields; demoSite: DemoSiteWorkflowFields | null | undefined; now?: Date; portfolioMode?: boolean }): string | null {
  if (portfolioMode) return 'Sending is disabled in portfolio mode'
  if (lead.pipeline_status !== 'approved') return 'Lead must be approved'
  if (lead.sales_status !== 'not_contacted') return 'Lead has already been contacted'
  if (lead.do_not_contact_at) return 'Lead is marked do not contact'
  if (!lead.email) return 'Lead email is required'
  if (outreach.status !== 'reviewed') return 'Outreach message must be reviewed before sending'
  if (outreach.sent_at) return 'Outreach message was already sent'
  const availabilityBlock = getDemoAvailabilityBlockReason(demoSite, now)
  if (availabilityBlock) return availabilityBlock
  if (!sameRelatedId(outreach.lead, lead.id)) return 'Outreach message must belong to the lead'
  if (!sameRelatedId(outreach.demo_site, demoSite?.id)) return 'Outreach message must belong to the active demo site'
  return null
}

function qaStatus(qaReport: unknown): string | undefined {
  if (!qaReport || typeof qaReport !== 'object') return undefined
  return typeof (qaReport as { status?: unknown }).status === 'string' ? (qaReport as { status: string }).status : undefined
}

function sameRelatedId(left: unknown, right: unknown): boolean {
  const leftId = relationId(left)
  const rightId = relationId(right)
  return Boolean(leftId && rightId && leftId === rightId)
}

function relationId(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return undefined
}
