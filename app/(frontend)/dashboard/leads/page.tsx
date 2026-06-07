import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest, type Where } from 'payload'

import { AppShell } from '@/components/dashboard/AppShell'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { LeadTable } from '@/components/dashboard/LeadTable'
import { SystemReadinessCard } from '@/components/dashboard/SystemReadinessCard'
import { Alert } from '@/components/ui/alert'
import { getSystemStatus } from '@/lib/system-status'
import { ImportLeadsForm } from './ImportLeadsForm'

export const dynamic = 'force-dynamic'

const pipelineStatuses = ['new', 'profile_ready', 'demo_content_ready', 'demo_ready', 'qa_failed', 'needs_review', 'approved', 'rejected']
const salesStatuses = ['not_contacted', 'contacted', 'replied', 'call_booked', 'won', 'lost']

type SearchParams = {
  pipeline_status?: string
  sales_status?: string
  demo_creation_approved?: string
}

type TableLead = {
  id: string | number
  business_name?: string | null
  city?: string | null
  pipeline_status?: string | null
  sales_status?: string | null
  demo_creation_approved_at?: string | null
}

type TableDemoSite = { slug?: string | null; qa_report?: unknown } | null
type TableOutreach = { status?: string | null } | null
type TableWorkflowRun = { operation?: string | null; status?: string | null; error?: string | null } | null

export default async function DashboardLeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) return <main className="p-8"><Alert variant="destructive">Unauthorized</Alert></main>

  const params = await searchParams
  const filters = buildFilters(params)
  const [leads, systemStatus] = await Promise.all([
    payload.find({ collection: 'leads', where: filters, limit: 50, sort: '-updatedAt' }),
    getSystemStatus(),
  ])
  const rows = await Promise.all(leads.docs.map(async (lead) => {
    const [demos, runs, outreachMessages] = await Promise.all([
      payload.find({ collection: 'demo-sites', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
      payload.find({ collection: 'workflow-runs', where: { lead: { equals: lead.id } }, limit: 1, sort: '-started_at' }),
      payload.find({ collection: 'outreach-messages', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' }),
    ])
    return {
      lead: lead as TableLead,
      demoSite: (demos.docs[0] as TableDemoSite | undefined) ?? null,
      workflowRun: (runs.docs[0] as TableWorkflowRun | undefined) ?? null,
      outreach: (outreachMessages.docs[0] as TableOutreach | undefined) ?? null,
    }
  }))

  return (
    <AppShell description="Import leads, filter by workflow state, and open the focused review screen for each business." title="Lead dashboard">
      <div className="grid gap-6">
        <SystemReadinessCard status={systemStatus} />
        <ImportLeadsForm />
        <FilterBar pipelineStatuses={pipelineStatuses} salesStatuses={salesStatuses} values={params} />
        <LeadTable rows={rows} />
      </div>
    </AppShell>
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
