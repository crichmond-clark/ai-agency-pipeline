import Link from 'next/link'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
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
  demoSite?: { slug?: string | null } | null
  workflowRun?: { operation?: string | null; status?: string | null; error?: string | null } | null
}

export function LeadTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <EmptyState title="No leads found" description="Import a CSV or clear filters to see leads here." />

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Demo approved</TableHead>
              <TableHead>Latest demo</TableHead>
              <TableHead>Latest workflow</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ lead, demoSite, workflowRun }) => (
              <TableRow key={lead.id}>
                <TableCell className="font-semibold text-zinc-50">{lead.business_name}</TableCell>
                <TableCell>{lead.city ?? '—'}</TableCell>
                <TableCell><StatusBadge value={lead.pipeline_status} /></TableCell>
                <TableCell><StatusBadge value={lead.sales_status} /></TableCell>
                <TableCell><StatusBadge value={Boolean(lead.demo_creation_approved_at)} /></TableCell>
                <TableCell>{demoSite?.slug ? <Link className="font-medium text-blue-400 hover:text-blue-300" href={`/demo/${demoSite.slug}`}>{demoSite.slug}</Link> : '—'}</TableCell>
                <TableCell>{workflowRun ? <WorkflowSummary run={workflowRun} /> : '—'}</TableCell>
                <TableCell className="text-right"><Link className="font-semibold text-blue-400 hover:text-blue-300" href={`/dashboard/review/${lead.id}`}>Review</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

function WorkflowSummary({ run }: { run: NonNullable<Row['workflowRun']> }) {
  return (
    <div className="max-w-xs space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-zinc-100">{run.operation ?? 'Workflow'}</span>
        <StatusBadge value={run.status} />
      </div>
      {run.error ? <p className="line-clamp-2 text-xs text-red-300">{run.error}</p> : null}
    </div>
  )
}
