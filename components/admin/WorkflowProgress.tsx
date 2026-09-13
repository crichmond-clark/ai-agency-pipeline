'use client'

import { Check, Circle } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { CardDescription, CardTitle } from '@/components/ui/card'
import type { ReviewStep } from '@/lib/review-workflow'

export function WorkflowProgress({ steps, completed }: { steps: ReviewStep[]; completed: number }) {
  return <>
    <div className="flex items-center justify-between gap-4"><div><CardTitle>Workflow progress &amp; run controls</CardTitle><CardDescription className="mt-2">{completed} of {steps.length} stages complete. The highlighted stage is the next decision.</CardDescription></div><span aria-label={`${Math.round((completed / steps.length) * 100)} percent complete`} className="text-sm font-medium text-muted-foreground">{Math.round((completed / steps.length) * 100)}%</span></div>
    <Progress aria-label="Workflow progress" className="mt-4" value={(completed / steps.length) * 100} />
    <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">{steps.map((step) => <li key={step.key}><Step step={step} /></li>)}</ol>
  </>
}

function Step({ step }: { step: ReviewStep }) {
  const target = step.key === 'demo-approval' ? 'review-controls' : step.key === 'profile' ? 'review-profile' : step.key === 'demo-content' ? 'review-demo' : step.key === 'qa' ? 'review-qa' : step.key === 'review' ? 'review-controls' : step.key === 'outreach' ? 'review-outreach' : 'review-controls'
  return <button aria-current={step.state === 'current' ? 'step' : undefined} className="group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title={`Go to ${step.label}`} type="button"><div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${step.state === 'complete' ? 'border-primary bg-primary text-primary-foreground' : step.state === 'current' ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>{step.state === 'complete' ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}</div><div><p className={`break-words text-xs font-semibold ${step.state === 'current' ? 'text-primary' : ''}`}>{step.label}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{step.state === 'blocked' ? 'Blocked · view details' : step.description}</p></div></button>
}
