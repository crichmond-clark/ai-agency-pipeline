import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

export async function POST(request: Request, { params }: { params: Promise<{ operationId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let input: { outcome?: 'accepted' | 'not_accepted'; provider_message_id?: string; evidence?: string }
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: 'Valid JSON is required' }, { status: 400 })
  }
  if (!input.outcome || !input.evidence?.trim()) return Response.json({ error: 'Outcome and reconciliation evidence are required' }, { status: 400 })

  const { operationId } = await params
  const operation = await payload.findByID({ collection: 'outreach-send-operations', id: operationId, depth: 1 })
  if (operation.state === 'sent' || operation.state === 'canceled') return Response.json({ operation })
  if (input.outcome === 'accepted' && !input.provider_message_id) return Response.json({ error: 'Provider message ID is required when accepted' }, { status: 400 })

  const state = input.outcome === 'accepted' ? 'sent' : 'canceled'
  const updated = await payload.update({
    collection: 'outreach-send-operations',
    id: operation.id,
    data: { state, provider_message_id: input.provider_message_id, active_slot_key: state === 'canceled' ? null : operation.active_slot_key, reconciled_at: new Date().toISOString(), reconciled_by: auth.user.id, reconciliation_evidence: input.evidence.trim() }, context: { workflowOperation: 'reconcile' },
  })
  if (state === 'sent') {
    await payload.update({ collection: 'outreach-messages', id: typeof operation.outreach_message === 'object' ? operation.outreach_message.id : operation.outreach_message, data: { status: 'sent', sent_at: new Date().toISOString() }, context: { workflowOperation: 'reconcile' } })
    await payload.update({ collection: 'leads', id: typeof operation.lead === 'object' ? operation.lead.id : operation.lead, data: { sales_status: 'contacted', last_contacted_at: new Date().toISOString() } })
  } else {
    await payload.update({ collection: 'outreach-messages', id: typeof operation.outreach_message === 'object' ? operation.outreach_message.id : operation.outreach_message, data: { status: 'draft', send_claimed_at: null, send_idempotency_key: null } })
  }
  return Response.json({ operation: updated })
}
