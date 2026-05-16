import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { AiServiceError, requestAiQa } from '@/lib/ai-service-client'
import { isResponse, resolveAiSelectionForRequest, withAiMetadata } from '@/lib/ai-route'
import { runDeterministicQa } from '@/lib/qa'
import { recordWorkflowRun } from '@/lib/workflow'
import { DemoContentSchema } from '@/types/ai'

export async function POST(request: Request, { params }: { params: Promise<{ demoSiteId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { demoSiteId } = await params
  const startedAt = new Date().toISOString()
  const aiSelection = await resolveAiSelectionForRequest(payload, request, 'qa')
  if (isResponse(aiSelection)) return aiSelection

  try {
    const demoSite = await payload.findByID({ collection: 'demo-sites', id: demoSiteId })
    const deterministic = runDeterministicQa(demoSite)
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? new URL(request.url).origin
    const ai = await requestAiQa({ demo_url: `${baseUrl}/demo/${demoSite.slug}`, content: DemoContentSchema.parse(demoSite.content) }, aiSelection)
    const combinedStatus = deterministic.status === 'passed' && ai.status === 'passed' ? 'passed' : 'failed'
    const qaReport = { ...(typeof demoSite.qa_report === 'object' && demoSite.qa_report ? demoSite.qa_report : {}), status: combinedStatus, deterministic, ai, checked_at: new Date().toISOString() }

    const updatedDemoSite = await payload.update({ collection: 'demo-sites', id: demoSite.id, data: { qa_report: qaReport } })
    await payload.update({ collection: 'leads', id: typeof demoSite.lead === 'object' ? demoSite.lead.id : demoSite.lead, data: { pipeline_status: combinedStatus === 'passed' ? 'needs_review' : 'qa_failed' } })
    await recordWorkflowRun(payload, { operation: 'qa_check', status: 'succeeded', lead: typeof demoSite.lead === 'object' ? demoSite.lead.id : demoSite.lead, demo_site: demoSite.id, started_at: startedAt, summary: `QA ${combinedStatus}`, metadata: withAiMetadata(aiSelection) })

    return Response.json({ demo_site: updatedDemoSite, qa_report: qaReport })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown QA error'
    const category = error instanceof AiServiceError ? error.category : 'validation_failed'
    await recordWorkflowRun(payload, { operation: 'qa_check', status: 'failed', demo_site: demoSiteId, started_at: startedAt, error: message, metadata: withAiMetadata(aiSelection, { error_category: category }) })
    return Response.json({ error: message, category }, { status: 400 })
  }
}
