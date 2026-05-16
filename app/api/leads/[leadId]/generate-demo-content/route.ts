import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { type LeadInput, requestDemoContent } from '@/lib/ai-service-client'
import { recordWorkflowRun } from '@/lib/workflow'
import { BusinessProfileSchema } from '@/types/ai'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const startedAt = new Date().toISOString()

  try {
    const lead = await payload.findByID({ collection: 'leads', id: leadId })
    const profiles = await payload.find({ collection: 'business-profiles', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' })
    const profileDoc = profiles.docs[0]
    if (!profileDoc) return Response.json({ error: 'Business Profile is required' }, { status: 409 })

    const profile = BusinessProfileSchema.parse(profileDoc)
    const content = await requestDemoContent({ lead: lead as LeadInput, profile })
    await payload.update({ collection: 'leads', id: lead.id, data: { pipeline_status: 'demo_content_ready' } })
    await recordWorkflowRun(payload, { operation: 'demo_content_generation', status: 'succeeded', lead: lead.id, started_at: startedAt, summary: 'Demo content generated', metadata: { content } })

    return Response.json({ content })
  } catch (error) {
    await recordWorkflowRun(payload, { operation: 'demo_content_generation', status: 'failed', lead: leadId, started_at: startedAt, error: error instanceof Error ? error.message : 'Unknown demo content generation error' })
    return Response.json({ error: 'Demo content generation failed' }, { status: 400 })
  }
}
