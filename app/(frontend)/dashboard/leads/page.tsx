import config from '@payload-config'
import type React from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest, type Where } from 'payload'

import { dashboardRelatedRecordLimit, indexLatestByLead } from '@/lib/lead-dashboard'
import { ImportLeadsForm } from './ImportLeadsForm'

export const dynamic = 'force-dynamic'

const pipelineStatuses = ['new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected']
const salesStatuses = ['not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost']

type SearchParams = {
  page?: string
  pipeline_status?: string
  sales_status?: string
  demo_creation_approved?: string
}

export default async function DashboardLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) return <main><h1>Unauthorized</h1></main>

  const params = await searchParams
  const filters = buildFilters(params)
  const page = parsePage(params.page)
  const leads = await payload.find({ collection: 'leads', where: filters, limit: 25, page, sort: '-updatedAt' })
  const leadIds = leads.docs.map((lead) => lead.id)
  const [demos, runs] = leadIds.length ? await Promise.all([
    payload.find({ collection: 'demo-sites', where: { lead: { in: leadIds } }, limit: dashboardRelatedRecordLimit, sort: '-updatedAt' }),
    payload.find({ collection: 'workflow-runs', where: { lead: { in: leadIds } }, limit: dashboardRelatedRecordLimit, sort: '-started_at' }),
  ]) : [{ docs: [] }, { docs: [] }]
  const demosByLead = indexLatestByLead(demos.docs)
  const runsByLead = indexLatestByLead(runs.docs)
  const rows = leads.docs.map((lead) => ({ lead, demoSite: demosByLead.get(String(lead.id)), workflowRun: runsByLead.get(String(lead.id)) }))

  return (
    <main style={{ padding: 32 }}>
      <h1>Lead dashboard</h1>
      <p>Page {leads.page} of {leads.totalPages} ({leads.totalDocs} leads)</p>
      <ImportLeadsForm />
      <form style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <FilterSelect label="Pipeline" name="pipeline_status" options={pipelineStatuses} value={params.pipeline_status} />
        <FilterSelect label="Sales" name="sales_status" options={salesStatuses} value={params.sales_status} />
        <label>
          Demo approved
          <select defaultValue={params.demo_creation_approved ?? ''} name="demo_creation_approved">
            <option value="">Any</option>
            <option value="yes">Approved</option>
            <option value="no">Not approved</option>
          </select>
        </label>
        <button type="submit">Filter</button>
        <Link href="/dashboard/leads">Clear</Link>
      </form>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <Header>Business</Header>
            <Header>City</Header>
            <Header>Pipeline</Header>
            <Header>Sales</Header>
            <Header>Demo approved</Header>
            <Header>Latest demo</Header>
            <Header>Latest workflow</Header>
            <Header>Review</Header>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ lead, demoSite, workflowRun }) => (
            <tr key={lead.id}>
              <Cell>{lead.business_name}</Cell>
              <Cell>{lead.city ?? '—'}</Cell>
              <Cell>{lead.pipeline_status}</Cell>
              <Cell>{lead.sales_status}</Cell>
              <Cell>{lead.demo_creation_approved_at ? 'yes' : 'no'}</Cell>
              <Cell>{demoSite ? <Link href={`/demo/${demoSite.slug}`}>{demoSite.slug}</Link> : '—'}</Cell>
              <Cell>{workflowRun ? `${workflowRun.operation}: ${workflowRun.status}${workflowRun.error ? ` — ${workflowRun.error}` : ''}` : '—'}</Cell>
              <Cell><Link href={`/dashboard/review/${lead.id}`}>Review</Link></Cell>
            </tr>
          ))}
        </tbody>
      </table>
      <nav aria-label="Lead pages" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {leads.hasPrevPage ? <Link href={pageHref(params, page - 1)}>Previous</Link> : null}
        {leads.hasNextPage ? <Link href={pageHref(params, page + 1)}>Next</Link> : null}
      </nav>
    </main>
  )
}

function parsePage(value?: string): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams()
  if (params.pipeline_status) query.set('pipeline_status', params.pipeline_status)
  if (params.sales_status) query.set('sales_status', params.sales_status)
  if (params.demo_creation_approved) query.set('demo_creation_approved', params.demo_creation_approved)
  query.set('page', String(page))
  return `/dashboard/leads?${query.toString()}`
}

function buildFilters(params: SearchParams): Where | undefined {
  const and: Where[] = []
  if (params.pipeline_status && pipelineStatuses.includes(params.pipeline_status)) and.push({ pipeline_status: { equals: params.pipeline_status } })
  if (params.sales_status && salesStatuses.includes(params.sales_status)) and.push({ sales_status: { equals: params.sales_status } })
  if (params.demo_creation_approved === 'yes') and.push({ demo_creation_approved_at: { exists: true } })
  if (params.demo_creation_approved === 'no') and.push({ demo_creation_approved_at: { exists: false } })
  return and.length ? { and } : undefined
}

function FilterSelect({ label, name, options, value }: { label: string; name: string; options: string[]; value?: string }) {
  return (
    <label>
      {label}
      <select defaultValue={value ?? ''} name={name}>
        <option value="">Any</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Header({ children }: { children: React.ReactNode }) {
  return <th style={{ borderBottom: '1px solid #ddd', padding: 8, textAlign: 'left' }}>{children}</th>
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td style={{ borderBottom: '1px solid #eee', padding: 8, verticalAlign: 'top' }}>{children}</td>
}
