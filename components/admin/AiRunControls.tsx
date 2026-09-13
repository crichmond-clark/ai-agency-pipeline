'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Loader2, Play, RefreshCw, Settings2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AiProvider } from '@/lib/ai-provider-options'

type ActionConfig = { key: string; label: string; endpoint: string; enabled: boolean; disabledReason?: string; confirmMessage?: string }
type Props = { providers: AiProvider[]; defaultProvider: AiProvider; defaultModel?: string; suggestions: Partial<Record<AiProvider, string[]>>; actions: ActionConfig[] }

export function AiRunControls({ providers, defaultProvider, defaultModel, suggestions, actions }: Props) {
  const router = useRouter()
  const [provider, setProvider] = useState<AiProvider>(defaultProvider)
  const [model, setModel] = useState(defaultModel ?? '')
  const [useOverride, setUseOverride] = useState(false)
  const [message, setMessage] = useState<string>()
  const [busyAction, setBusyAction] = useState<string>()
  const [refreshing, setRefreshing] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<ActionConfig>()

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
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> Run controls</CardTitle>
            <CardDescription className="mt-2">Run the next pipeline step with the configured AI selection.</CardDescription>
          </div>
          <Badge variant="outline">{actions.filter((action) => action.enabled).length} available</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/40 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium"><input checked={useOverride} className="h-4 w-4 accent-primary" onChange={(event) => setUseOverride(event.target.checked)} type="checkbox" /> Override model for this run</label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Provider<select aria-label="AI provider" className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={!useOverride} onChange={(event) => setProvider(event.target.value as AiProvider)} value={provider}>{providers.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-medium">Model<input aria-label="AI model" className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={!useOverride || provider === 'deterministic'} list="model-suggestions" onChange={(event) => setModel(event.target.value)} value={model} /><datalist id="model-suggestions">{(suggestions[provider] ?? []).map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist></label>
          </div>
          <Button className="mt-4" disabled={refreshing || provider === 'deterministic' || !useOverride} onClick={refreshModels} size="sm" type="button" variant="outline">{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{refreshing ? 'Refreshing…' : 'Refresh models'}</Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{actions.map((action) => { const isBusy = busyAction === action.key; const isDestructive = action.key === 'reject'; return <div className="flex min-h-20 items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40" key={action.key}><div className="min-w-0"><p className="break-words text-sm font-medium leading-5">{action.label}</p>{!action.enabled && action.disabledReason ? <p className="mt-1 break-words text-xs leading-4 text-muted-foreground">{action.disabledReason}</p> : null}</div><Button aria-label={`${action.label}${action.enabled ? '' : `: ${action.disabledReason ?? 'complete'}`}`} className="shrink-0" disabled={!action.enabled || Boolean(busyAction)} onClick={() => requestAction(action)} size="icon" title={action.enabled ? action.label : action.disabledReason} type="button" variant={isDestructive ? 'outline' : action.enabled ? 'default' : 'secondary'}>{isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : action.enabled ? <Play className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}<span className="sr-only">{isBusy ? 'Running' : action.enabled ? 'Run' : 'Done'}</span></Button></div> })}</div>
        {pendingConfirmation ? <div aria-live="polite" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Confirm {pendingConfirmation.label}</p><p className="mt-1">{pendingConfirmation.confirmMessage}</p><div className="mt-3 flex gap-2"><Button onClick={() => { const action = pendingConfirmation; setPendingConfirmation(undefined); void runAction(action) }} size="sm" variant="destructive">Confirm</Button><Button onClick={() => setPendingConfirmation(undefined)} size="sm" variant="outline">Cancel</Button></div></div> : null}
        {message ? <p aria-live="polite" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
