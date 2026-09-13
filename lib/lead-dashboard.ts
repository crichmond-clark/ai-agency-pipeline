import type { Where } from 'payload'

export const pipelineStatuses = ['new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected'] as const
export const salesStatuses = ['not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost'] as const

export type LeadDashboardSearchParams = {
  page?: string
  pipeline_status?: string
  sales_status?: string
  demo_creation_approved?: string
}

export type DashboardBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
export const dashboardRelatedRecordLimit = 500

export function parseDashboardPage(value?: string): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function buildLeadFilters(params: LeadDashboardSearchParams): Where | undefined {
  const and: Where[] = []
  if (params.pipeline_status && pipelineStatuses.includes(params.pipeline_status as (typeof pipelineStatuses)[number])) and.push({ pipeline_status: { equals: params.pipeline_status } })
  if (params.sales_status && salesStatuses.includes(params.sales_status as (typeof salesStatuses)[number])) and.push({ sales_status: { equals: params.sales_status } })
  if (params.demo_creation_approved === 'yes') and.push({ demo_creation_approved_at: { exists: true } })
  if (params.demo_creation_approved === 'no') and.push({ demo_creation_approved_at: { exists: false } })
  return and.length ? { and } : undefined
}

export function leadDashboardHref(params: LeadDashboardSearchParams, page: number): string {
  const query = new URLSearchParams()
  if (pipelineStatuses.includes(params.pipeline_status as (typeof pipelineStatuses)[number])) query.set('pipeline_status', params.pipeline_status!)
  if (salesStatuses.includes(params.sales_status as (typeof salesStatuses)[number])) query.set('sales_status', params.sales_status!)
  if (params.demo_creation_approved === 'yes' || params.demo_creation_approved === 'no') query.set('demo_creation_approved', params.demo_creation_approved)
  query.set('page', String(page))
  return `/dashboard/leads?${query.toString()}`
}

export function formatDashboardStatus(value: string | null | undefined): string {
  if (!value) return 'Not available'
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function statusBadgeVariant(status: string | null | undefined): DashboardBadgeVariant {
  if (status === 'approved' || status === 'succeeded' || status === 'won' || status === 'replied') return 'success'
  if (status === 'qa_failed' || status === 'failed' || status === 'rejected' || status === 'lost') return 'destructive'
  if (status === 'needs_review' || status === 'call_booked') return 'warning'
  if (status === 'contacted' || status === 'profile_ready' || status === 'demo_ready' || status === 'demo_content_ready') return 'secondary'
  return 'outline'
}

export function hasActiveDashboardFilters(params: LeadDashboardSearchParams): boolean {
  return Boolean(buildLeadFilters(params))
}

export function indexLatestByLead<T extends { lead?: unknown }>(documents: T[]): Map<string, T> {
  const latest = new Map<string, T>()
  for (const document of documents) {
    const leadId = relationshipId(document.lead)
    if (leadId && !latest.has(leadId)) latest.set(leadId, document)
  }
  return latest
}

function relationshipId(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return undefined
}
