import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { type LeadInput, requestBusinessProfile } from '@/lib/ai-service-client'
import { recordWorkflowRun } from '@/lib/workflow'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const startedAt = new Date().toISOString()

  try {
    const lead = await payload.findByID({ collection: 'leads', id: leadId })
    if (!lead.demo_creation_approved_at) return Response.json({ error: 'Demo Creation Approval is required' }, { status: 409 })

    const profile = await requestBusinessProfile(lead as LeadInput)
    const savedProfile = await payload.create({ collection: 'business-profiles', data: { lead: lead.id, ...profile } })
    await payload.update({ collection: 'leads', id: lead.id, data: { pipeline_status: 'profile_ready' } })
    await recordWorkflowRun(payload, { operation: 'profile_generation', status: 'succeeded', lead: lead.id, started_at: startedAt, summary: 'Business profile generated' })

    return Response.json({ business_profile: savedProfile })
  } catch (error) {
    await recordWorkflowRun(payload, { operation: 'profile_generation', status: 'failed', lead: leadId, started_at: startedAt, error: error instanceof Error ? error.message : 'Unknown profile generation error' })
    return Response.json({ error: 'Profile generation failed' }, { status: 400 })
  }
}
