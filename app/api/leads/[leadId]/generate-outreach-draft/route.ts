import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { type LeadInput, requestOutreachDraft } from '@/lib/ai-service-client'
import { recordWorkflowRun } from '@/lib/workflow'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const startedAt = new Date().toISOString()

  try {
    const lead = await payload.findByID({ collection: 'leads', id: leadId })
    if (lead.pipeline_status !== 'approved') return Response.json({ error: 'Lead must be approved before outreach draft generation' }, { status: 409 })
    if (lead.do_not_contact_at) return Response.json({ error: 'Lead is marked do not contact' }, { status: 409 })

    const demos = await payload.find({ collection: 'demo-sites', where: { and: [{ lead: { equals: lead.id } }, { is_public: { equals: true } }, { removed_at: { exists: false } }] }, limit: 1, sort: '-updatedAt' })
    const demoSite = demos.docs[0]
    if (!demoSite) return Response.json({ error: 'Available demo site is required' }, { status: 409 })

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? new URL(request.url).origin
    const draft = await requestOutreachDraft({ lead: lead as LeadInput, demo_url: `${baseUrl}/demo/${demoSite.slug}` })
    const outreach = await payload.create({ collection: 'outreach-messages', data: { lead: lead.id, demo_site: demoSite.id, status: 'draft', ...draft } })
    await recordWorkflowRun(payload, { operation: 'outreach_generation', status: 'succeeded', lead: lead.id, demo_site: demoSite.id, outreach_message: outreach.id, started_at: startedAt, summary: 'Outreach draft generated' })

    return Response.json({ outreach_message: outreach })
  } catch (error) {
    await recordWorkflowRun(payload, { operation: 'outreach_generation', status: 'failed', lead: leadId, started_at: startedAt, error: error instanceof Error ? error.message : 'Unknown outreach generation error' })
    return Response.json({ error: 'Outreach draft generation failed' }, { status: 400 })
  }
}
