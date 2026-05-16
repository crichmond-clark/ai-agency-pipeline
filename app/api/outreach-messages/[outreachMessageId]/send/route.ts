import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { sendOutreachEmail } from '@/lib/resend'
import { recordWorkflowRun } from '@/lib/workflow'

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

    const sendResult = await sendOutreachEmail({ to: lead.email!, subject: outreach.subject, body: outreach.body })
    const sentAt = new Date().toISOString()
    const updatedOutreach = await payload.update({ collection: 'outreach-messages', id: outreach.id, data: { status: 'sent', sent_at: sentAt } })
    await payload.create({ collection: 'contact-attempts', data: { lead: lead.id, outreach_message: outreach.id, channel: 'email', sent_at: sentAt, provider: 'resend', provider_message_id: sendResult.providerMessageId, summary: 'Initial outreach email sent' } })
    await payload.update({ collection: 'leads', id: lead.id, data: { sales_status: 'contacted', last_contacted_at: sentAt } })
    await recordWorkflowRun(payload, { operation: 'outreach_send', status: 'succeeded', lead: lead.id, demo_site: demoSite?.id, outreach_message: outreach.id, started_at: startedAt, summary: 'Outreach email sent' })

    return Response.json({ outreach_message: updatedOutreach, provider_message_id: sendResult.providerMessageId })
  } catch (error) {
    await recordWorkflowRun(payload, { operation: 'outreach_send', status: 'failed', outreach_message: outreachMessageId, started_at: startedAt, error: error instanceof Error ? error.message : 'Unknown outreach send error' })
    return Response.json({ error: 'Outreach send failed' }, { status: 400 })
  }
}

type SendGuardLead = { pipeline_status?: string | null; sales_status?: string | null; do_not_contact_at?: string | null; email?: string | null }
type SendGuardOutreach = { status?: string | null; sent_at?: string | null }
type SendGuardDemoSite = { is_public?: boolean | null; removed_at?: string | null } | null

function getSendBlockReason({ lead, outreach, demoSite }: { lead: SendGuardLead; outreach: SendGuardOutreach; demoSite: SendGuardDemoSite }) {
  if (process.env.PORTFOLIO_MODE === 'true') return 'Sending is disabled in portfolio mode'
  if (lead.pipeline_status !== 'approved') return 'Lead must be approved'
  if (lead.sales_status !== 'not_contacted') return 'Lead has already been contacted'
  if (lead.do_not_contact_at) return 'Lead is marked do not contact'
  if (!lead.email) return 'Lead email is required'
  if (outreach.status !== 'reviewed') return 'Outreach message must be reviewed before sending'
  if (outreach.sent_at) return 'Outreach message was already sent'
  if (!demoSite || !demoSite.is_public || demoSite.removed_at) return 'Available public demo site is required'
  return null
}
