import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Row = {
  lead: {
    id: string | number
    business_name?: string | null
    city?: string | null
    pipeline_status?: string | null
    sales_status?: string | null
    demo_creation_approved_at?: string | null
  }
  demoSite?: { slug?: string | null; qa_report?: unknown } | null
  outreach?: { status?: string | null } | null
  workflowRun?: { operation?: string | null; status?: string | null; error?: string | null } | null
}

export function LeadTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <EmptyState title="No leads found" description="Import a CSV or clear filters to see leads here." />

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Pipeline</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>Next action</TableHead>
            <TableHead>Latest demo</TableHead>
            <TableHead>Latest workflow</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ lead, demoSite, outreach, workflowRun }) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-semibold">{lead.business_name}</div>
                <div className="text-xs text-muted-foreground">{lead.city ?? '—'}</div>
              </TableCell>
              <TableCell><StatusBadge value={lead.pipeline_status} /></TableCell>
              <TableCell><StatusBadge value={lead.sales_status} /></TableCell>
              <TableCell><NextAction lead={lead} demoSite={demoSite} outreach={outreach} /></TableCell>
              <TableCell>{demoSite?.slug ? <Link className="font-medium text-primary hover:underline" href={`/demo/${demoSite.slug}`}>{demoSite.slug}</Link> : '—'}</TableCell>
              <TableCell>{workflowRun ? <WorkflowSummary run={workflowRun} /> : '—'}</TableCell>
              <TableCell className="text-right"><ButtonLink href={`/dashboard/review/${lead.id}`} size="sm" variant="outline">Review <ArrowRight className="h-3 w-3" /></ButtonLink></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function NextAction({ lead, demoSite, outreach }: Pick<Row, 'lead' | 'demoSite' | 'outreach'>) {
  const label = nextActionLabel(lead, Boolean(demoSite), outreach?.status)
  return <span className="text-sm font-medium">{label}</span>
}

function nextActionLabel(lead: Row['lead'], hasDemo: boolean, outreachStatus?: string | null): string {
  if (!lead.demo_creation_approved_at) return 'Approve demo creation'
  if (lead.pipeline_status === 'new') return 'Generate profile'
  if (lead.pipeline_status === 'profile_ready') return 'Generate demo content'
  if (lead.pipeline_status === 'demo_ready') return 'Run QA'
  if (lead.pipeline_status === 'qa_failed') return 'Fix/regenerate then rerun QA'
  if (lead.pipeline_status === 'needs_review') return 'Review and approve/reject'
  if (lead.pipeline_status === 'approved' && !outreachStatus) return 'Generate outreach draft'
  if (lead.pipeline_status === 'approved' && outreachStatus === 'draft') return 'Review outreach draft'
  if (lead.pipeline_status === 'approved' && outreachStatus === 'reviewed') return 'Ready to send when enabled'
  if (lead.pipeline_status === 'approved' && hasDemo) return 'Track sales status'
  if (lead.pipeline_status === 'rejected') return 'Rejected'
  return 'Open review'
}

function WorkflowSummary({ run }: { run: NonNullable<Row['workflowRun']> }) {
  return (
    <div className="max-w-xs space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{run.operation ?? 'Workflow'}</span>
        <StatusBadge value={run.status} />
      </div>
      {run.error ? <p className="line-clamp-2 text-xs text-destructive">{run.error}</p> : null}
    </div>
  )
}
