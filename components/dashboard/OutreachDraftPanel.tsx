'use client'

import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export type OutreachDraft = {
  id: string | number
  subject?: string | null
  body?: string | null
  safety_notes?: string | null
  status?: string | null
  sent_at?: string | null
}

export function OutreachDraftPanel({ outreach }: { outreach?: OutreachDraft | null }) {
  const router = useRouter()
  const [subject, setSubject] = useState(outreach?.subject ?? '')
  const [body, setBody] = useState(outreach?.body ?? '')
  const [saving, setSaving] = useState(false)

  if (!outreach) {
    return (
      <Card>
        <CardHeader><CardTitle>Outreach Draft</CardTitle><CardDescription>Generate a draft after final lead approval.</CardDescription></CardHeader>
        <CardContent><Alert><AlertDescription>No outreach draft generated yet.</AlertDescription></Alert></CardContent>
      </Card>
    )
  }

  const editable = outreach.status !== 'sent' && !outreach.sent_at

  async function saveDraft() {
    if (!outreach) return
    setSaving(true)
    try {
      const response = await fetch(`/api/outreach-messages/${outreach.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Failed to save draft')
      toast.success('Outreach draft saved')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Outreach Draft</CardTitle>
            <CardDescription>Edit copy inline, then mark reviewed before sending.</CardDescription>
          </div>
          <StatusBadge value={outreach.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="outreach-subject">Subject</Label>
          <Input disabled={!editable || saving} id="outreach-subject" onChange={(event) => setSubject(event.target.value)} value={subject} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outreach-body">Body</Label>
          <Textarea className="min-h-56" disabled={!editable || saving} id="outreach-body" onChange={(event) => setBody(event.target.value)} value={body} />
        </div>
        {outreach.safety_notes ? <Alert variant="warning"><AlertDescription>{outreach.safety_notes}</AlertDescription></Alert> : null}
        <Button disabled={!editable || saving} onClick={saveDraft} type="button"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save draft'}</Button>
      </CardContent>
    </Card>
  )
}
