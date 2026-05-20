import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export function FilterBar({ pipelineStatuses, salesStatuses, values }: { pipelineStatuses: string[]; salesStatuses: string[]; values: { pipeline_status?: string; sales_status?: string; demo_creation_approved?: string } }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
          <FilterSelect label="Pipeline" name="pipeline_status" options={pipelineStatuses} value={values.pipeline_status} />
          <FilterSelect label="Sales" name="sales_status" options={salesStatuses} value={values.sales_status} />
          <div className="space-y-2">
            <Label htmlFor="demo_creation_approved">Demo approved</Label>
            <Select defaultValue={values.demo_creation_approved ?? ''} id="demo_creation_approved" name="demo_creation_approved">
              <option value="">Any</option>
              <option value="yes">Approved</option>
              <option value="no">Not approved</option>
            </Select>
          </div>
          <Button type="submit">Filter</Button>
          <Link className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50" href="/dashboard/leads">Clear</Link>
        </form>
      </CardContent>
    </Card>
  )
}

function FilterSelect({ label, name, options, value }: { label: string; name: string; options: string[]; value?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select defaultValue={value ?? ''} id={name} name={name}>
        <option value="">Any</option>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
      </Select>
    </div>
  )
}
