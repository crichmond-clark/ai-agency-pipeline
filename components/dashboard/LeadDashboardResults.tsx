import Link from 'next/link'
import { ArrowRight, Eye, MapPin, ShieldAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDemoAvailabilityBlockReason } from '@/lib/demo-availability'
import { formatDashboardStatus, statusBadgeVariant } from '@/lib/lead-dashboard'
import { cn } from '@/lib/utils'
import type { DemoSite, Lead, WorkflowRun } from '@/payload-types'

export type LeadDashboardRow = { lead: Lead; demoSite?: DemoSite; workflowRun?: WorkflowRun }

export function LeadDashboardResults({ rows, portfolioMode }: { rows: LeadDashboardRow[]; portfolioMode: boolean }) {
  if (!rows.length) return <section aria-labelledby="lead-results-heading"><h2 className="sr-only" id="lead-results-heading">Lead results</h2><Card><CardContent className="py-14 text-center"><p className="text-base font-medium">No Leads match these filters</p><p className="mt-2 text-sm text-muted-foreground">Clear the filters or import a business-finder CSV to add Leads.</p></CardContent></Card></section>

  return <section aria-labelledby="lead-results-heading"><h2 className="sr-only" id="lead-results-heading">Lead results</h2>
    <Card className="hidden overflow-hidden xl:block">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Leads and their current workflow, sales, and Demo Site states</caption>
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><Header>Business</Header><Header>Workflow</Header><Header>Sales</Header><Header>Demo Site</Header><Header><span className="sr-only">Open review</span></Header></tr></thead>
        <tbody>{rows.map((row) => <DesktopRow key={row.lead.id} portfolioMode={portfolioMode} row={row} />)}</tbody>
      </table>
    </Card>
    <div className="grid gap-4 xl:hidden">{rows.map((row) => <MobileCard key={row.lead.id} portfolioMode={portfolioMode} row={row} />)}</div>
  </section>
}

function DesktopRow({ row, portfolioMode }: { row: LeadDashboardRow; portfolioMode: boolean }) {
  const availability = demoAvailability(row, portfolioMode)
  return <tr className="even:bg-muted/25 transition-colors hover:bg-primary/5 focus-within:bg-primary/5 motion-reduce:transition-none">
    <Cell><Business lead={row.lead} /></Cell>
    <Cell><div className="space-y-2"><Badge variant={statusBadgeVariant(row.lead.pipeline_status)}>{formatDashboardStatus(row.lead.pipeline_status)}</Badge><WorkflowSummary run={row.workflowRun} /></div></Cell>
    <Cell><Badge variant={statusBadgeVariant(row.lead.sales_status)}>{formatDashboardStatus(row.lead.sales_status)}</Badge></Cell>
    <Cell>{row.demoSite ? <div className="space-y-2"><Link className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/dashboard/review/${row.lead.id}/demo-preview`}><Eye className="h-4 w-4" /> Admin preview</Link><p className="max-w-56 text-xs text-muted-foreground">{availability}</p></div> : <span className="text-muted-foreground">Not generated</span>}</Cell>
    <Cell className="text-right"><ReviewLink lead={row.lead} /></Cell>
  </tr>
}

function MobileCard({ row, portfolioMode }: { row: LeadDashboardRow; portfolioMode: boolean }) {
  const availability = demoAvailability(row, portfolioMode)
  return <Card className="transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring motion-reduce:transform-none motion-reduce:transition-none"><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-4"><Business lead={row.lead} /><ReviewLink lead={row.lead} /></div><div className="flex flex-wrap gap-2"><Badge variant={statusBadgeVariant(row.lead.pipeline_status)}>{formatDashboardStatus(row.lead.pipeline_status)}</Badge><Badge variant={statusBadgeVariant(row.lead.sales_status)}>Sales: {formatDashboardStatus(row.lead.sales_status)}</Badge>{row.lead.demo_creation_approved_at ? <Badge variant="outline">Demo creation approved</Badge> : null}</div><WorkflowSummary run={row.workflowRun} />{row.demoSite ? <div className="flex flex-col gap-1 rounded-lg bg-muted/55 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-muted-foreground">{availability}</span><Link className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/dashboard/review/${row.lead.id}/demo-preview`}><Eye className="h-4 w-4" /> Admin preview</Link></div> : null}</CardContent></Card>
}

function Business({ lead }: { lead: Lead }) { return <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words font-semibold">{lead.business_name}</p>{lead.do_not_contact_at ? <Badge variant="warning"><ShieldAlert className="mr-1 h-3 w-3" /> Do Not Contact</Badge> : null}</div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {lead.city ?? 'Location unavailable'}</p>{lead.email ? <p className="mt-1 break-all text-xs text-muted-foreground">{lead.email}</p> : null}</div> }
function WorkflowSummary({ run }: { run?: WorkflowRun }) { return run ? <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{formatDashboardStatus(run.operation)}</span> · {formatDashboardStatus(run.status)}{run.error ? <p className="mt-1 line-clamp-2 max-w-md text-destructive">{run.error}</p> : null}</div> : <p className="text-xs text-muted-foreground">No workflow activity yet</p> }
function ReviewLink({ lead }: { lead: Lead }) { return <Link aria-label={`Review ${lead.business_name}`} className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'shrink-0')} href={`/dashboard/review/${lead.id}`} title={`Review ${lead.business_name}`}><ArrowRight className="h-4 w-4" /></Link> }
function demoAvailability(row: LeadDashboardRow, portfolioMode: boolean): string { if (!row.demoSite) return 'Not generated'; const blocked = getDemoAvailabilityBlockReason(row.demoSite); if (blocked) return blocked; if (portfolioMode && !row.lead.is_sample_lead) return 'Public access hidden in Portfolio Mode'; return 'Publicly available' }
function Header({ children }: { children: React.ReactNode }) { return <th className="px-5 py-3 font-semibold" scope="col">{children}</th> }
function Cell({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={cn('px-5 py-4 align-top', className)}>{children}</td> }
