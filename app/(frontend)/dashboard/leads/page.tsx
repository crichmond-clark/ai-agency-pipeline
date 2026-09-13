import config from '@payload-config'
import type React from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { LayoutDashboard } from 'lucide-react'
import { getPayload, type PayloadRequest } from 'payload'

import { Card, CardContent } from '@/components/ui/card'
import { LeadDashboardFilters } from '@/components/dashboard/LeadDashboardFilters'
import { buildLeadFilters, dashboardRelatedRecordLimit, indexLatestByLead, leadDashboardHref, parseDashboardPage, type LeadDashboardSearchParams } from '@/lib/lead-dashboard'
import { ImportLeadsForm } from './ImportLeadsForm'

export const dynamic = 'force-dynamic'

export default async function DashboardLeadsPage({ searchParams }: { searchParams: Promise<LeadDashboardSearchParams> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: await headers(), req: { payload } as PayloadRequest })
  if (!auth.user) return <main><h1>Unauthorized</h1></main>

  const params = await searchParams
  const filters = buildLeadFilters(params)
  const page = parseDashboardPage(params.page)
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
    <main className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><LayoutDashboard className="h-5 w-5" /></div><h1 className="text-2xl font-semibold tracking-tight">Lead dashboard</h1></div><p className="mt-2 text-sm text-muted-foreground">Review imported businesses and move each Lead through the demo workflow.</p></div>
        <div className="text-left sm:text-right"><p className="text-2xl font-semibold">{leads.totalDocs}</p><p className="text-xs uppercase tracking-wide text-muted-foreground">{leads.totalDocs === 1 ? 'Lead' : 'Leads'}</p></div>
      </header>
      <ImportLeadsForm />
      <LeadDashboardFilters params={params} />
      <Card><CardContent className="p-0">
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
      </CardContent></Card>
      <nav aria-label="Lead pages" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {leads.hasPrevPage ? <Link href={leadDashboardHref(params, page - 1)}>Previous</Link> : null}
        {leads.hasNextPage ? <Link href={leadDashboardHref(params, page + 1)}>Next</Link> : null}
      </nav>
      </div>
    </main>
  )
}

function Header({ children }: { children: React.ReactNode }) {
  return <th style={{ borderBottom: '1px solid #ddd', padding: 8, textAlign: 'left' }}>{children}</th>
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td style={{ borderBottom: '1px solid #eee', padding: 8, verticalAlign: 'top' }}>{children}</td>
}
