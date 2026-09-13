import config from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react'
import { getPayload, type PayloadRequest } from 'payload'

import { buttonVariants } from '@/components/ui/button'
import { LeadDashboardFilters } from '@/components/dashboard/LeadDashboardFilters'
import { LeadDashboardResults } from '@/components/dashboard/LeadDashboardResults'
import { buildLeadFilters, dashboardRelatedRecordLimit, indexLatestByLead, leadDashboardHref, parseDashboardPage, type LeadDashboardSearchParams } from '@/lib/lead-dashboard'
import { cn } from '@/lib/utils'
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
      <header className="flex flex-col gap-4 rounded-xl bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><LayoutDashboard className="h-5 w-5" /></div><h1 className="text-2xl font-semibold tracking-tight">Lead dashboard</h1></div><p className="mt-2 text-sm text-muted-foreground">Review imported businesses and move each Lead through the demo workflow.</p></div>
        <div className="text-left sm:text-right"><p className="text-2xl font-semibold">{leads.totalDocs}</p><p className="text-xs uppercase tracking-wide text-muted-foreground">{leads.totalDocs === 1 ? 'Lead' : 'Leads'}</p></div>
      </header>
      <ImportLeadsForm />
      <LeadDashboardFilters params={params} />
      <LeadDashboardResults portfolioMode={process.env.PORTFOLIO_MODE === 'true'} rows={rows} />
      <nav aria-label="Lead result pages" className="flex flex-col gap-3 rounded-xl bg-card px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-muted-foreground">Page <span className="font-medium text-foreground">{leads.page}</span> of <span className="font-medium text-foreground">{Math.max(leads.totalPages, 1)}</span></p>
        <div className="flex gap-2">
          {leads.hasPrevPage ? <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={leadDashboardHref(params, page - 1)} rel="prev"><ChevronLeft className="h-4 w-4" /> Previous</Link> : <span aria-disabled="true" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-not-allowed opacity-50')}><ChevronLeft className="h-4 w-4" /> Previous</span>}
          {leads.hasNextPage ? <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href={leadDashboardHref(params, page + 1)} rel="next">Next <ChevronRight className="h-4 w-4" /></Link> : <span aria-disabled="true" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-not-allowed opacity-50')}>Next <ChevronRight className="h-4 w-4" /></span>}
        </div>
      </nav>
      </div>
    </main>
  )
}
