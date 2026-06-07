import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type WorkflowStage = {
  key: string
  label: string
  description: string
  state: 'done' | 'current' | 'blocked' | 'pending'
}

export function WorkflowStepper({ stages }: { stages: WorkflowStage[] }) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-5">
        {stages.map((stage) => (
          <div key={stage.key} className={cn('rounded-lg border p-3', stage.state === 'current' ? 'border-primary bg-primary/5' : 'bg-background')}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <StageIcon state={stage.state} />
                {stage.label}
              </div>
              <StatusBadge value={stage.state === 'done' ? 'succeeded' : stage.state === 'blocked' ? 'failed' : stage.state === 'current' ? 'running' : undefined} />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{stage.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StageIcon({ state }: { state: WorkflowStage['state'] }) {
  if (state === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (state === 'current') return <CircleDashed className="h-4 w-4 text-primary" />
  return <Circle className="h-4 w-4 text-muted-foreground" />
}
