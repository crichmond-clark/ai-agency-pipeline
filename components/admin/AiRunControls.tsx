'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Loader2, Play, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AiProvider } from '@/lib/ai-provider-options'
import type { ReviewStep, ReviewStepKey } from '@/lib/review-workflow'
import { WorkflowProgress } from './WorkflowProgress'

type ActionConfig = { key: string; label: string; endpoint: string; enabled: boolean; disabledReason?: string; confirmMessage?: string }
type Props = { providers: AiProvider[]; defaultProvider: AiProvider; defaultModel?: string; suggestions: Partial<Record<AiProvider, string[]>>; actions: ActionConfig[]; workflowSteps: ReviewStep[]; completedSteps: number }

export function AiRunControls({ providers, defaultProvider, defaultModel, suggestions, actions, workflowSteps, completedSteps }: Props) {
  const router = useRouter()
  const [provider, setProvider] = useState<AiProvider>(defaultProvider)
  const [model, setModel] = useState(defaultModel ?? '')
  const [useOverride, setUseOverride] = useState(false)
  const [message, setMessage] = useState<string>()
  const [busyAction, setBusyAction] = useState<string>()
  const [refreshing, setRefreshing] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<ActionConfig>()
  const [selectedStep, setSelectedStep] = useState<ReviewStepKey>(() => workflowSteps.find((step) => step.state === 'current')?.key ?? 'demo-approval')
  const selectedWorkflowStep = workflowSteps.find((step) => step.key === selectedStep) ?? workflowSteps[0]
  const selectedActions = actions.filter((action) => actionStep(action.key) === selectedStep)

  async function runAction(action: ActionConfig) {
    setBusyAction(action.key)
    setMessage(undefined)
    try {
      const response = await fetch(action.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(useOverride ? { ai: { provider, model } } : {}) })
      const body = await response.json().catch(() => ({})) as { error?: string; category?: string }
      if (!response.ok) throw new Error(body.error ?? body.category ?? 'Action failed')
      setMessage(`${action.label} succeeded`)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${action.label} failed`)
    } finally { setBusyAction(undefined) }
  }

  function requestAction(action: ActionConfig) {
    if (action.confirmMessage) {
      setPendingConfirmation(action)
      return
    }
    void runAction(action)
  }

  async function refreshModels() {
    setRefreshing(true); setMessage(undefined)
    try {
      const response = await fetch('/api/ai-models/refresh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider }) })
      const body = await response.json().catch(() => ({})) as { error?: string; models?: string[] }
      if (!response.ok) throw new Error(body.error ?? 'Model refresh failed')
      setMessage(`Refreshed ${body.models?.length ?? 0} models for ${provider}`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Model refresh failed') }
    finally { setRefreshing(false) }
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <WorkflowProgress completed={completedSteps} onSelect={setSelectedStep} selected={selectedStep} steps={workflowSteps} />
        <section aria-label={`${selectedWorkflowStep.label} actions`} className="rounded-xl bg-muted/45 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{selectedWorkflowStep.label}</p><p className="mt-1 text-xs text-muted-foreground">{selectedWorkflowStep.description}</p></div><div className="flex flex-wrap gap-2">{selectedActions.map((action) => { const isBusy = busyAction === action.key; const isDestructive = action.key === 'reject'; return <Button disabled={!action.enabled || Boolean(busyAction)} key={action.key} onClick={() => requestAction(action)} size="sm" title={action.enabled ? action.label : action.disabledReason} type="button" variant={isDestructive ? 'destructive' : action.enabled ? 'default' : 'secondary'}>{isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : action.enabled ? <Play className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{isBusy ? 'Running…' : action.label}</Button> })}</div></div>
          {selectedActions.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No actions are available for this stage.</p> : null}
          {selectedActions.every((action) => !action.enabled) ? <div className="mt-3 space-y-1">{selectedActions.map((action) => <p className="text-xs text-muted-foreground" key={action.key}>{action.label}: {action.disabledReason ?? 'Complete'}</p>)}</div> : null}
        </section>
        <details className="rounded-lg bg-muted/35 p-4">
          <summary className="cursor-pointer text-sm font-medium">AI model override</summary>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-medium"><input checked={useOverride} className="h-4 w-4 accent-primary" onChange={(event) => setUseOverride(event.target.checked)} type="checkbox" /> Override model for this run</label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Provider<select aria-label="AI provider" className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={!useOverride} onChange={(event) => setProvider(event.target.value as AiProvider)} value={provider}>{providers.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-medium">Model<input aria-label="AI model" className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={!useOverride || provider === 'deterministic'} list="model-suggestions" onChange={(event) => setModel(event.target.value)} value={model} /><datalist id="model-suggestions">{(suggestions[provider] ?? []).map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist></label>
          </div>
          <Button className="mt-4" disabled={refreshing || provider === 'deterministic' || !useOverride} onClick={refreshModels} size="sm" type="button" variant="outline">{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{refreshing ? 'Refreshing…' : 'Refresh models'}</Button>
        </details>
        {pendingConfirmation ? <div aria-live="polite" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Confirm {pendingConfirmation.label}</p><p className="mt-1">{pendingConfirmation.confirmMessage}</p><div className="mt-3 flex gap-2"><Button onClick={() => { const action = pendingConfirmation; setPendingConfirmation(undefined); void runAction(action) }} size="sm" variant="destructive">Confirm</Button><Button onClick={() => setPendingConfirmation(undefined)} size="sm" variant="outline">Cancel</Button></div></div> : null}
        {message ? <p aria-live="polite" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{message}</p> : null}
      </CardContent>
    </Card>
  )
}

function actionStep(actionKey: string): ReviewStepKey {
  if (actionKey === 'approve-demo-creation') return 'demo-approval'
  if (actionKey === 'profile') return 'profile'
  if (actionKey === 'demo-content') return 'demo-content'
  if (actionKey === 'capture' || actionKey === 'qa') return 'qa'
  if (actionKey === 'approve' || actionKey === 'reject') return 'review'
  if (actionKey === 'outreach' || actionKey === 'mark-reviewed') return 'outreach'
  return 'send'
}
