'use client'

import { Check, Circle } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { CardDescription, CardTitle } from '@/components/ui/card'
import type { ReviewStep, ReviewStepKey } from '@/lib/review-workflow'

export function WorkflowProgress({ steps, completed, selected, onSelect }: { steps: ReviewStep[]; completed: number; selected: ReviewStepKey; onSelect: (key: ReviewStepKey) => void }) {
  return <>
    <div className="flex items-center justify-between gap-4"><div><CardTitle>Lead workflow</CardTitle><CardDescription className="mt-2">{completed} of {steps.length} stages complete. Select a stage to inspect it or run its available action.</CardDescription></div><span aria-label={`${Math.round((completed / steps.length) * 100)} percent complete`} className="text-sm font-medium text-muted-foreground">{Math.round((completed / steps.length) * 100)}%</span></div>
    <Progress aria-label="Workflow progress" className="mt-4" value={(completed / steps.length) * 100} />
    <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">{steps.map((step) => <li key={step.key}><Step onSelect={onSelect} selected={selected === step.key} step={step} /></li>)}</ol>
  </>
}

function Step({ step, selected, onSelect }: { step: ReviewStep; selected: boolean; onSelect: (key: ReviewStepKey) => void }) {
  return <button aria-current={step.state === 'current' ? 'step' : undefined} aria-expanded={selected} className={`group flex min-h-20 w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent'}`} onClick={() => onSelect(step.key)} title={`Open ${step.label} actions`} type="button"><div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${step.state === 'complete' ? 'border-primary bg-primary text-primary-foreground' : step.state === 'current' ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>{step.state === 'complete' ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}</div><div><p className={`break-words text-xs font-semibold ${step.state === 'current' ? 'text-primary' : ''}`}>{step.label}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{step.state === 'blocked' ? 'Blocked · inspect' : selected ? 'Actions open below' : step.description}</p></div></button>
}
