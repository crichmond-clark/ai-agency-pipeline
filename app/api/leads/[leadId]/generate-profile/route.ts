import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { AiServiceError, type LeadInput, requestBusinessProfile } from '@/lib/ai-service-client'
import { isResponse, resolveAiSelectionForRequest, withAiMetadata } from '@/lib/ai-route'
import { recordWorkflowRun } from '@/lib/workflow'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const startedAt = new Date().toISOString()
  const aiSelection = await resolveAiSelectionForRequest(payload, request, 'profile')
  if (isResponse(aiSelection)) return aiSelection

  try {
    const lead = await payload.findByID({ collection: 'leads', id: leadId })
    if (!lead.demo_creation_approved_at) return Response.json({ error: 'Demo Creation Approval is required' }, { status: 409 })

    const profile = await requestBusinessProfile(lead as LeadInput, aiSelection)
    const existingProfiles = await payload.find({ collection: 'business-profiles', where: { lead: { equals: lead.id } }, limit: 1 })
    const savedProfile = existingProfiles.docs[0]
      ? await payload.update({ collection: 'business-profiles', id: existingProfiles.docs[0].id, data: { lead: lead.id, ...profile } })
      : await payload.create({ collection: 'business-profiles', data: { lead: lead.id, ...profile } })
    await payload.update({ collection: 'leads', id: lead.id, data: { pipeline_status: 'profile_ready' } })
    await recordWorkflowRun(payload, { operation: 'profile_generation', status: 'succeeded', lead: lead.id, started_at: startedAt, summary: 'Business profile generated', metadata: withAiMetadata(aiSelection) })

    return Response.json({ business_profile: savedProfile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown profile generation error'
    const category = error instanceof AiServiceError ? error.category : 'validation_failed'
    await recordWorkflowRun(payload, { operation: 'profile_generation', status: 'failed', lead: leadId, started_at: startedAt, error: message, metadata: withAiMetadata(aiSelection, { error_category: category }) })
    return Response.json({ error: message, category }, { status: 400 })
  }
}
