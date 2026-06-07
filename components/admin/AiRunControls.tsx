'use client'

import { RefreshCw, Wand2 } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { AiProvider } from '@/lib/ai-provider-options'

type ActionConfig = {
  key: string
  label: string
  endpoint: string
  enabled: boolean
  disabledReason?: string
}

type Props = {
  providers: AiProvider[]
  defaultProvider: AiProvider
  defaultModel?: string
  suggestions: Partial<Record<AiProvider, string[]>>
  actions: ActionConfig[]
}

export function AiRunControls({ providers, defaultProvider, defaultModel, suggestions, actions }: Props) {
  const [provider, setProvider] = useState<AiProvider>(defaultProvider)
  const [model, setModel] = useState(defaultModel ?? '')
  const [useOverride, setUseOverride] = useState(false)
  const [message, setMessage] = useState<string>()
  const [busyAction, setBusyAction] = useState<string>()
  const [refreshing, setRefreshing] = useState(false)

  async function runAction(action: ActionConfig) {
    setBusyAction(action.key)
    setMessage(undefined)
    try {
      const response = await fetch(action.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(useOverride ? { ai: { provider, model } } : {}),
      })
      const body = await response.json().catch(() => ({})) as { error?: string; category?: string }
      if (!response.ok) throw new Error(body.error ?? body.category ?? 'Action failed')
      setMessage(`${action.label} succeeded`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${action.label} failed`)
    } finally {
      setBusyAction(undefined)
    }
  }

  async function refreshModels() {
    setRefreshing(true)
    setMessage(undefined)
    try {
      const response = await fetch('/api/ai-models/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const body = await response.json().catch(() => ({})) as { error?: string; models?: string[] }
      if (!response.ok) throw new Error(body.error ?? 'Model refresh failed')
      setMessage(`Refreshed ${body.models?.length ?? 0} models for ${provider}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Model refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-blue-400" /> AI run controls</CardTitle>
        <CardDescription>Run the next workflow step. Model overrides apply only to this request.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 text-sm font-medium text-zinc-200">
          <input checked={useOverride} className="h-4 w-4 rounded border-zinc-600 accent-blue-500" onChange={(event) => setUseOverride(event.target.checked)} type="checkbox" />
          Override model for this run
        </label>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select disabled={!useOverride} id="provider" onChange={(event) => setProvider(event.target.value as AiProvider)} value={provider}>
              {providers.map((option) => <option key={option} value={option}>{option}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input disabled={!useOverride || provider === 'deterministic'} id="model" list="model-suggestions" onChange={(event) => setModel(event.target.value)} value={model} />
            <datalist id="model-suggestions">
              {(suggestions[provider] ?? []).map((suggestion) => <option key={suggestion} value={suggestion} />)}
            </datalist>
          </div>
          <Button className="gap-2" disabled={refreshing || provider === 'deterministic'} onClick={refreshModels} type="button" variant="outline">
            <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> {refreshing ? 'Refreshing…' : 'Refresh models'}
          </Button>
        </div>
        <Separator />
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action) => (
            <button className="rounded-xl border border-zinc-700 bg-zinc-950/70 p-4 text-left shadow-sm transition hover:border-blue-500/70 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-zinc-700 disabled:hover:bg-zinc-950/70" disabled={!action.enabled || Boolean(busyAction)} key={action.key} onClick={() => runAction(action)} title={action.disabledReason} type="button">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-zinc-50">{busyAction === action.key ? 'Running…' : action.label}</span>
                <StatusBadge value={action.enabled ? 'ready' : 'blocked'} />
              </div>
              {!action.enabled && action.disabledReason ? <p className="mt-2 text-sm text-zinc-400">{action.disabledReason}</p> : null}
            </button>
          ))}
        </div>
        {message ? <Alert role="status" variant={message.includes('succeeded') || message.includes('Refreshed') ? 'success' : 'destructive'}>{message}</Alert> : null}
      </CardContent>
    </Card>
  )
}
