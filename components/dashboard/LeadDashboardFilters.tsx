import Link from 'next/link'
import { Filter, RotateCcw } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDashboardStatus, hasActiveDashboardFilters, pipelineStatuses, salesStatuses, type LeadDashboardSearchParams } from '@/lib/lead-dashboard'
import { cn } from '@/lib/utils'

export function LeadDashboardFilters({ params }: { params: LeadDashboardSearchParams }) {
  const hasFilters = hasActiveDashboardFilters(params)
  return <Card>
    <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4 text-primary" /> Filter leads</CardTitle><CardDescription>Narrow the list by workflow, sales, or Demo Creation Approval state.</CardDescription></CardHeader>
    <CardContent>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <FilterSelect label="Pipeline status" name="pipeline_status" options={[...pipelineStatuses]} value={params.pipeline_status} />
        <FilterSelect label="Sales status" name="sales_status" options={[...salesStatuses]} value={params.sales_status} />
        <FilterSelect label="Demo creation" name="demo_creation_approved" options={['yes', 'no']} value={params.demo_creation_approved} optionLabels={{ yes: 'Approved', no: 'Not approved' }} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button className="flex-1 lg:flex-none" type="submit"><Filter className="h-4 w-4" /> Apply</Button>
          {hasFilters ? <Link aria-label="Clear all filters" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'shrink-0')} href="/dashboard/leads" title="Clear filters"><RotateCcw className="h-4 w-4" /></Link> : null}
        </div>
      </form>
    </CardContent>
  </Card>
}

function FilterSelect({ label, name, options, value, optionLabels }: { label: string; name: string; options: string[]; value?: string; optionLabels?: Record<string, string> }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring" defaultValue={value ?? ''} name={name}><option value="">Any</option>{options.map((option) => <option key={option} value={option}>{optionLabels?.[option] ?? formatDashboardStatus(option)}</option>)}</select></label>
}
