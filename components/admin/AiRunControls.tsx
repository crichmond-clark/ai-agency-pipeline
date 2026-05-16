'use client'

import { useState } from 'react'

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
    <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginTop: 24 }}>
      <h2>AI run controls</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <input checked={useOverride} onChange={(event) => setUseOverride(event.target.checked)} type="checkbox" /> Override model for this run
      </label>
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label>
          Provider
          <select disabled={!useOverride} onChange={(event) => setProvider(event.target.value as AiProvider)} value={provider} style={{ display: 'block', width: '100%' }}>
            {providers.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Model
          <input disabled={!useOverride || provider === 'deterministic'} list="model-suggestions" onChange={(event) => setModel(event.target.value)} value={model} style={{ display: 'block', width: '100%' }} />
          <datalist id="model-suggestions">
            {(suggestions[provider] ?? []).map((suggestion) => <option key={suggestion} value={suggestion} />)}
          </datalist>
        </label>
        <button disabled={refreshing || provider === 'deterministic'} onClick={refreshModels} type="button">{refreshing ? 'Refreshing…' : 'Refresh models'}</button>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 20, maxWidth: 520 }}>
        {actions.map((action) => (
          <button disabled={!action.enabled || Boolean(busyAction)} key={action.key} onClick={() => runAction(action)} title={action.disabledReason} type="button">
            {busyAction === action.key ? 'Running…' : action.label}{!action.enabled && action.disabledReason ? ` — ${action.disabledReason}` : ''}
          </button>
        ))}
      </div>
      {message ? <p role="status">{message}</p> : null}
    </section>
  )
}
