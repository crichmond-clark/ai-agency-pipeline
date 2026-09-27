'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

type Fact = { value: unknown; source: string; reviewer: number; reviewed_at: string }
type Asset = { id: string; originalFilename?: string; mimeType?: string; byteLength?: number }
type Props = { intakeId: number; status: string; deliveryStatus: string; expiresAt: string; answers: unknown; acceptedFacts: unknown; assets: unknown }
const fields = ['business_name', 'contact_name', 'contact_email', 'phone', 'website', 'address', 'city', 'business_description', 'services', 'service_areas', 'intended_audience', 'primary_goal', 'brand_guidance', 'supplied_copy', 'external_asset_links', 'unanswered'] as const

export function ClientIntakeReview({ intakeId, status, deliveryStatus, expiresAt, answers, acceptedFacts, assets: rawAssets }: Props) {
  const answerRecord = asRecord(answers)
  const accepted = asRecord(acceptedFacts) as Record<string, Fact>
  const prefillSnapshot = asRecord(answerRecord.prefill_snapshot)
  const fieldStatus = asRecord(answerRecord.field_status)
  const assets = (Array.isArray(rawAssets) ? rawAssets : []).filter((asset): asset is Asset => Boolean(asset) && typeof asset === 'object' && 'id' in asset && typeof asset.id === 'string')
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'rejected'>>({})
  const missingSections = Array.isArray(answerRecord.missing_sections) ? answerRecord.missing_sections : []
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const visibleFields = fields.filter((field) => answerRecord[field] !== undefined)
  const claims = Array.isArray(answerRecord.claims) ? answerRecord.claims : []

  async function save(finalize: boolean) {
    if (!Object.keys(decisions).length) { setMessage('Select accept or reject for at least one submitted section.'); return }
    setBusy(true)
    try {
      const response = await fetch(`/api/client-intakes/${intakeId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decisions, finalize }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Review could not be saved')
      setMessage(finalize ? 'Review saved and marked complete.' : 'Review decisions saved.')
      window.location.reload()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Review could not be saved') } finally { setBusy(false) }
  }

  function exportBrief() {
    const brief = { source: 'owner_accepted_client_intake', accepted_facts: accepted, missing_sections: missingSections }
    const url = URL.createObjectURL(new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `client-brief-${intakeId}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function choose(path: string, decision: 'accepted' | 'rejected') {
    setDecisions((current) => ({ ...current, [path]: decision }))
  }

  return (
    <section className="space-y-5 rounded-xl bg-card p-5" aria-label="Private client intake review">
      <div><h2 className="text-xl font-semibold">Private client intake</h2><p className="mt-1 text-sm text-muted-foreground">Status: {status} · email delivery: {deliveryStatus} · expiry: {new Date(expiresAt).toLocaleString()}</p></div>
      {missingSections.length ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-950">Explicitly missing: {missingSections.map(String).join(', ')}</p> : null}
      {assets.length ? <div className="space-y-2"><h3 className="font-semibold">Private uploaded assets</h3><ul className="space-y-2">{assets.map((asset) => <li key={asset.id}><a className="text-primary underline" href={`/api/client-intakes/${intakeId}/assets/${asset.id}`} download>{asset.originalFilename || 'Download asset'} ({asset.mimeType}, {asset.byteLength} bytes)</a></li>)}</ul></div> : null}
      {status === 'submitted' || status === 'reviewed' ? <>
        <div className="space-y-4">
          {visibleFields.map((field) => <article className="space-y-2 rounded-lg bg-muted/35 p-4" key={field}>
            <h3 className="font-medium">{field.replaceAll('_', ' ')}</h3>
            <pre className="whitespace-pre-wrap break-words text-sm">{JSON.stringify(answerRecord[field], null, 2)}</pre>
            {prefillSnapshot[field] !== undefined ? <p className="text-xs text-muted-foreground">{field === 'services' ? 'Public/AI-structured profile prefill (unverified):' : 'Lead source-provided prefill:'} {JSON.stringify(prefillSnapshot[field])}</p> : null}
            {fieldStatus[field] ? <p className="text-xs text-muted-foreground">Compared with prefill: {String(fieldStatus[field])}</p> : null}
            <p className="text-xs text-muted-foreground">Submitted information remains unverified until individually accepted by an owner.</p>
            <DecisionButtons path={field} decision={decisions[field]} choose={choose} />
            {accepted[field] ? <p className="text-xs text-green-700">Accepted by owner at {new Date(accepted[field].reviewed_at).toLocaleString()}</p> : null}
          </article>)}
          {claims.map((claim, index) => <article key={`claim-${index}`} className="rounded-lg bg-muted/35 p-4"><h3 className="font-medium">Claim {index + 1}</h3><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(claim, null, 2)}</pre><p className="text-xs text-muted-foreground">Source and permission responses are respondent-provided, not independently verified.</p><DecisionButtons path={`claims.${index}`} decision={decisions[`claims.${index}`]} choose={choose} />{accepted[`claims.${index}`] ? <p className="text-xs text-green-700">Accepted at {new Date(accepted[`claims.${index}`].reviewed_at).toLocaleString()}</p> : null}</article>)}
        </div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => save(false)}>Save decisions</Button><Button type="button" disabled={busy || status === 'reviewed'} onClick={() => save(true)}>Complete review</Button><Button type="button" variant="outline" onClick={exportBrief}>Export accepted client brief</Button></div>
      </> : <p className="text-sm text-muted-foreground">No submitted answers are available for review.</p>}
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </section>
  )
}

function DecisionButtons({ path, decision, choose }: { path: string; decision?: 'accepted' | 'rejected'; choose: (path: string, decision: 'accepted' | 'rejected') => void }) {
  return <div className="flex gap-2"><Button type="button" size="sm" variant={decision === 'accepted' ? 'default' : 'outline'} onClick={() => choose(path, 'accepted')}>Accept</Button><Button type="button" size="sm" variant={decision === 'rejected' ? 'destructive' : 'outline'} onClick={() => choose(path, 'rejected')}>Reject</Button></div>
}

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
