import config from '@payload-config'
import type React from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest, type Where } from 'payload'

import { ImportLeadsForm } from './ImportLeadsForm'

export const dynamic = 'force-dynamic'

const pipelineStatuses = ['new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected']
const salesStatuses = ['not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost']

type SearchParams = {
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
  const leads = await payload.find({ collection: 'leads', where: filters, limit: 50, sort: '-updatedAt' })
  const rows = await Promise.all(leads.docs.map(async (lead) => {
    const [demos, runs] = await Promise.all([
      payload.find({ collection: 'demo-sites', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
      payload.find({ collection: 'workflow-runs', where: { lead: { equals: lead.id } }, limit: 1, sort: '-started_at' }),
    ])
    return { lead, demoSite: demos.docs[0], workflowRun: runs.docs[0] }
  }))

  return (
    <main style={{ padding: 32 }}>
      <h1>Lead dashboard</h1>
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
    </main>
  )
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
