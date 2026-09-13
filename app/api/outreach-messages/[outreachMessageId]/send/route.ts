import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { sendOutreachEmail } from '@/lib/resend'
import { recordWorkflowRun } from '@/lib/workflow'
import { getSendBlockReason } from '@/lib/workflow-guards'

export async function POST(request: Request, { params }: { params: Promise<{ outreachMessageId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { outreachMessageId } = await params
  const startedAt = new Date().toISOString()

  try {
    const outreach = await payload.findByID({ collection: 'outreach-messages', id: outreachMessageId, depth: 1 })
    const lead = typeof outreach.lead === 'object' ? outreach.lead : await payload.findByID({ collection: 'leads', id: outreach.lead })
    const demoSite = typeof outreach.demo_site === 'object' ? outreach.demo_site : outreach.demo_site ? await payload.findByID({ collection: 'demo-sites', id: outreach.demo_site }) : null

    const blocked = getSendBlockReason({ lead, outreach, demoSite })
    if (blocked) return Response.json({ error: blocked }, { status: 409 })

    const idempotencyKey = typeof outreach.send_idempotency_key === 'string' && outreach.send_idempotency_key ? outreach.send_idempotency_key : `initial-outreach/${outreach.id}`
    const existingOperations = await payload.find({ collection: 'outreach-send-operations', where: { idempotency_key: { equals: idempotencyKey } }, limit: 1 })
    const existingOperation = existingOperations.docs[0]
    if (existingOperation?.state === 'sent') return Response.json({ operation_id: existingOperation.id, state: 'sent', provider_message_id: existingOperation.provider_message_id })
    if (existingOperation && existingOperation.state !== 'failed' && existingOperation.state !== 'canceled') return Response.json({ error: 'An outreach send is already in progress or needs reconciliation', operation_id: existingOperation.id, state: existingOperation.state }, { status: 409 })

    const claimed = await payload.update({ collection: 'outreach-messages', id: outreach.id, data: { status: 'sending', send_idempotency_key: idempotencyKey, send_claimed_at: startedAt }, context: { workflowOperation: 'send' } })
    const operation = await payload.create({ collection: 'outreach-send-operations', data: { lead: lead.id, outreach_message: outreach.id, purpose: 'initial_outreach', active_slot_key: `initial:${lead.id}`, state: 'dispatching', idempotency_key: idempotencyKey, snapshot: { to: lead.email, subject: outreach.subject, body: outreach.body, demo_site: demoSite?.id, demo_revision: demoSite?.content_revision ?? 1 }, first_dispatched_at: startedAt, last_attempt_at: startedAt } })
    const sendResult = await sendOutreachEmail({ to: lead.email!, subject: outreach.subject, body: outreach.body, idempotencyKey })
    const sentAt = new Date().toISOString()
    const updatedOutreach = await payload.update({ collection: 'outreach-messages', id: claimed.id, data: { status: 'sent', sent_at: sentAt }, context: { workflowOperation: 'send' } })
    await payload.update({ collection: 'outreach-send-operations', id: operation.id, data: { state: 'sent', provider_message_id: sendResult.providerMessageId, last_attempt_at: sentAt } })
    await payload.create({ collection: 'contact-attempts', data: { lead: lead.id, outreach_message: outreach.id, channel: 'email', sent_at: sentAt, provider: 'resend', provider_message_id: sendResult.providerMessageId, summary: 'Initial outreach email sent' } })
    await payload.update({ collection: 'leads', id: lead.id, data: { sales_status: 'contacted', last_contacted_at: sentAt } })
    await recordWorkflowRun(payload, { operation: 'outreach_send', status: 'succeeded', lead: lead.id, demo_site: demoSite?.id, outreach_message: outreach.id, started_at: startedAt, summary: 'Outreach email sent' })

    return Response.json({ outreach_message: updatedOutreach, provider_message_id: sendResult.providerMessageId })
  } catch (error) {
    // The operation remains dispatching/unknown if the provider may have accepted it.
    await recordWorkflowRun(payload, { operation: 'outreach_send', status: 'failed', outreach_message: outreachMessageId, started_at: startedAt, error: error instanceof Error ? error.message : 'Unknown outreach send error' })
    return Response.json({ error: 'Outreach send failed' }, { status: 400 })
  }
}
