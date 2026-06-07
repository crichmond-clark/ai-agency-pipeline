'use client'

import { ShieldOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ContactabilityControl({ leadId, blocked, reason }: { leadId: string; blocked: boolean; reason?: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setBlocked(nextBlocked: boolean) {
    setBusy(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/contactability`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ doNotContact: nextBlocked, reason: 'Blocked from dashboard safety toggle' }),
      })
      const body = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to update contactability')
      toast.success(nextBlocked ? 'Outreach blocked for this lead' : 'Outreach re-enabled for this lead')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update contactability')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={blocked ? 'border-destructive/30 bg-destructive/5' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><ShieldOff className="h-5 w-5 text-muted-foreground" /> Outreach safety</span>
          <StatusBadge value={blocked ? 'do_not_contact' : 'contact_allowed'} />
        </CardTitle>
        <CardDescription>Reversible guard that blocks outreach draft review and sending without rejecting the lead.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm">
          <input checked={blocked} className="mt-1 h-4 w-4 accent-primary" disabled={busy} onChange={(event) => setBlocked(event.target.checked)} type="checkbox" />
          <span>
            <span className="block font-medium">Block outreach for this lead</span>
            <span className="mt-1 block text-muted-foreground">When checked, generated outreach cannot be reviewed or sent.</span>
          </span>
        </label>
        {reason ? <p className="text-xs text-muted-foreground">Reason: {reason}</p> : null}
        <Button disabled={busy} onClick={() => setBlocked(!blocked)} type="button" variant={blocked ? 'outline' : 'secondary'}>
          {busy ? 'Updating…' : blocked ? 'Allow outreach again' : 'Block outreach'}
        </Button>
      </CardContent>
    </Card>
  )
}
