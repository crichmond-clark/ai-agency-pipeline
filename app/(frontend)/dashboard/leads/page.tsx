import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type PayloadRequest, type Where } from 'payload'

import { AppShell } from '@/components/dashboard/AppShell'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { LeadTable } from '@/components/dashboard/LeadTable'
import { Alert } from '@/components/ui/alert'
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
  if (!auth.user) return <main className="p-8"><Alert variant="destructive">Unauthorized</Alert></main>

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
    <AppShell description="Import leads, filter by workflow state, and open the focused review screen for each business." title="Lead dashboard">
      <div className="grid gap-6">
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
