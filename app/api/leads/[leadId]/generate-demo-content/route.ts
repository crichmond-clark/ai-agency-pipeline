import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { AiServiceError, type LeadInput, requestDemoContent } from '@/lib/ai-service-client'
import { isResponse, resolveAiSelectionForRequest, withAiMetadata } from '@/lib/ai-route'
import { demoSlugForLead } from '@/lib/slugify'
import { selectTemplate } from '@/lib/template-selector'
import { recordWorkflowRun } from '@/lib/workflow'
import { BusinessProfileSchema } from '@/types/ai'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const startedAt = new Date().toISOString()
  const aiSelection = await resolveAiSelectionForRequest(payload, request, 'demo_content')
  if (isResponse(aiSelection)) return aiSelection

  try {
    const lead = await payload.findByID({ collection: 'leads', id: leadId })
    const profiles = await payload.find({ collection: 'business-profiles', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' })
    const profileDoc = profiles.docs[0]
    if (!profileDoc) return Response.json({ error: 'Business Profile is required' }, { status: 409 })

    const profile = BusinessProfileSchema.parse(profileDoc)
    const content = await requestDemoContent({ lead: lead as LeadInput, profile }, aiSelection)
    const existingDemoSites = await payload.find({ collection: 'demo-sites', where: { lead: { equals: lead.id } }, limit: 1, sort: '-updatedAt' })
    const template = selectTemplate()
    const demoSiteData = {
      lead: lead.id,
      business_profile: profileDoc.id,
      template,
      slug: existingDemoSites.docs[0]?.slug ?? demoSlugForLead(lead),
      content,
      is_public: true,
    }
    const demoSite = existingDemoSites.docs[0]
      ? await payload.update({ collection: 'demo-sites', id: existingDemoSites.docs[0].id, data: demoSiteData })
      : await payload.create({ collection: 'demo-sites', data: demoSiteData })

    await payload.update({ collection: 'leads', id: lead.id, data: { pipeline_status: 'demo_ready' } })
    await recordWorkflowRun(payload, { operation: 'demo_content_generation', status: 'succeeded', lead: lead.id, demo_site: demoSite.id, started_at: startedAt, summary: 'Demo content generated and demo site saved', metadata: withAiMetadata(aiSelection, { demo_url: `/demo/${demoSite.slug}` }) })

    return Response.json({ demo_site: demoSite, content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown demo content generation error'
    const category = error instanceof AiServiceError ? error.category : 'validation_failed'
    await recordWorkflowRun(payload, { operation: 'demo_content_generation', status: 'failed', lead: leadId, started_at: startedAt, error: message, metadata: withAiMetadata(aiSelection, { error_category: category }) })
    return Response.json({ error: message, category }, { status: 400 })
  }
}
