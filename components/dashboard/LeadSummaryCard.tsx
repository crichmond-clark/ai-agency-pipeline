import type { ReactNode } from 'react'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type LeadSummary = {
  business_name?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website_url?: string | null
  website_status?: string | null
  pipeline_status?: string | null
  sales_status?: string | null
  demo_creation_approved_at?: string | null
  do_not_contact_at?: string | null
}

export function LeadSummaryCard({ lead }: { lead: LeadSummary }) {
  const rows = [
    ['City', lead.city],
    ['Address', lead.address],
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['Website', lead.website_url],
    ['Website status', lead.website_status],
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead summary</CardTitle>
        <CardDescription>Imported lead data and current workflow state.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <State label="Pipeline" value={<StatusBadge value={lead.pipeline_status} />} />
          <State label="Sales" value={<StatusBadge value={lead.sales_status} />} />
          <State label="Demo creation" value={<StatusBadge value={Boolean(lead.demo_creation_approved_at)} />} />
          <State label="Contactability" value={<StatusBadge value={lead.do_not_contact_at ? 'do_not_contact' : 'contact_allowed'} />} />
        </div>
        <dl className="grid gap-3 text-sm">
          {rows.map(([label, value]) => (
            <div className="grid gap-1 sm:grid-cols-[140px_1fr]" key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words font-medium">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function State({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border bg-muted/30 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1">{value}</div></div>
}
