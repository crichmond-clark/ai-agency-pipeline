'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function LeadIntakeControls({ leadId, qualificationStatus, eligible, activeIntake }: { leadId: string; qualificationStatus: string; eligible: boolean; activeIntake?: { id: number; status: string; delivery_status: string; expires_at: string } }) {
  const [status, setStatus] = useState(qualificationStatus)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function qualify(next: 'qualified' | 'not_fit' | 'unreviewed') {
    setBusy(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/qualification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update qualification')
      setStatus(result.qualification_status)
      setMessage(`Qualification set to ${result.qualification_status}.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update qualification') } finally { setBusy(false) }
  }

  async function invite() {
    if (!window.confirm('Send a private seven-day website content questionnaire invitation to this lead?')) return
    setBusy(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/client-intake-invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmSend: true }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send invitation')
      setMessage(`${result.delivery_status === 'sent' ? 'Invitation sent.' : 'Delivery failed. Copy the link for manual delivery:'} ${result.url}`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send invitation') } finally { setBusy(false) }
  }

  return <section className="space-y-3 rounded-lg bg-muted/40 p-4" aria-label="Qualification and client intake"><h3 className="font-semibold">Qualification and content intake</h3><p className="text-sm text-muted-foreground">Qualification is separate from demo production. Submitted answers remain unverified until reviewed.</p><p className="text-sm">Qualification: <strong>{status}</strong></p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy || status === 'qualified'} onClick={() => qualify('qualified')}>Mark qualified</Button><Button type="button" variant="outline" disabled={busy || status === 'not_fit'} onClick={() => qualify('not_fit')}>Mark not fit</Button><Button type="button" variant="outline" disabled={busy || status === 'unreviewed'} onClick={() => qualify('unreviewed')}>Reset review</Button><Button type="button" disabled={busy || status !== 'qualified' || !eligible} onClick={invite}>Confirm and send intake invitation</Button></div>{activeIntake ? <p className="text-sm">Existing intake: {activeIntake.status} · delivery {activeIntake.delivery_status} · expires {new Date(activeIntake.expires_at).toLocaleDateString()}</p> : null}{message ? <p className="break-all text-sm" role="status">{message}</p> : null}</section>
}
