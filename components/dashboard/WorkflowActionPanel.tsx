'use client'

import { RefreshCw, Wand2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { AiProvider } from '@/lib/ai-provider-options'

export type WorkflowAction = {
  key: string
  label: string
  description: string
  endpoint: string
  enabled: boolean
  disabledReason?: string
  confirm?: {
    title: string
    description: string
    destructive?: boolean
  }
  aiTask?: boolean
  status?: 'ready' | 'blocked' | 'complete'
}

type Props = {
  providers: AiProvider[]
  defaultProvider: AiProvider
  defaultModel?: string
  suggestions: Partial<Record<AiProvider, string[]>>
  actions: WorkflowAction[]
}

export function WorkflowActionPanel({ providers, defaultProvider, defaultModel, suggestions, actions }: Props) {
  const router = useRouter()
  const [provider, setProvider] = useState<AiProvider>(defaultProvider)
  const [model, setModel] = useState(defaultModel ?? '')
  const [useOverride, setUseOverride] = useState(false)
  const [busyAction, setBusyAction] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [refreshing, setRefreshing] = useState(false)

  async function runAction(action: WorkflowAction) {
    setBusyAction(action.key)
    setMessage(undefined)
    try {
      const response = await fetch(action.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action.aiTask && useOverride ? { ai: { provider, model } } : {}),
      })
      const body = await response.json().catch(() => ({})) as { error?: string; category?: string }
      if (!response.ok) throw new Error(body.error ?? body.category ?? 'Action failed')
      toast.success(`${action.label} succeeded`)
      setMessage(`${action.label} succeeded`)
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${action.label} failed`
      toast.error(errorMessage)
      setMessage(errorMessage)
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
      const success = `Refreshed ${body.models?.length ?? 0} models for ${provider}`
      toast.success(success)
      setMessage(success)
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Model refresh failed'
      toast.error(errorMessage)
      setMessage(errorMessage)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Workflow actions</CardTitle>
        <CardDescription>Everything needed to move this lead through the MVP pipeline. Server-side guards are still authoritative.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input checked={useOverride} className="h-4 w-4 accent-primary" onChange={(event) => setUseOverride(event.target.checked)} type="checkbox" />
            Override AI provider/model for generation and QA actions
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
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
        </div>
        <Separator />
        <div className="grid gap-3">
          {actions.map((action) => <ActionButton action={action} busy={busyAction === action.key} disabled={Boolean(busyAction)} key={action.key} onRun={() => runAction(action)} />)}
        </div>
        {message ? <Alert variant={message.includes('succeeded') || message.includes('Refreshed') ? 'success' : 'destructive'}><AlertDescription>{message}</AlertDescription></Alert> : null}
      </CardContent>
    </Card>
  )
}

function ActionButton({ action, busy, disabled, onRun }: { action: WorkflowAction; busy: boolean; disabled: boolean; onRun: () => void }) {
  const button = (
    <Button className="h-auto w-full justify-between gap-4 whitespace-normal p-4 text-left" disabled={!action.enabled || disabled} type="button" variant={action.confirm?.destructive ? 'destructive' : 'outline'} onClick={action.confirm ? undefined : onRun}>
      <span>
        <span className="block font-semibold">{busy ? 'Running…' : action.label}</span>
        <span className="mt-1 block text-xs font-normal opacity-80">{action.enabled ? action.description : action.disabledReason}</span>
      </span>
      <StatusBadge value={action.status ?? (action.enabled ? 'ready' : 'blocked')} />
    </Button>
  )

  if (!action.confirm) return button

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{action.confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>{action.confirm.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className={action.confirm.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined} onClick={onRun}>{action.label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
