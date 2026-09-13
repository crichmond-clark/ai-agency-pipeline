import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { getApprovalBlockReason } from '@/lib/workflow-guards'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await params
  const leadToApprove = await payload.findByID({ collection: 'leads', id: leadId })
  const demoSites = await payload.find({ collection: 'demo-sites', where: { lead: { equals: leadToApprove.id } }, limit: 1, sort: '-updatedAt' })
  const demoSite = demoSites.docs[0]
  const blocked = getApprovalBlockReason({ lead: leadToApprove, demoSite })
  if (blocked) return Response.json({ error: blocked }, { status: 409 })

  const lead = await payload.update({ collection: 'leads', id: leadId, data: { pipeline_status: 'approved', approved_demo_site: demoSite.id, approved_demo_revision: (demoSite as { content_revision?: number }).content_revision ?? 1, approved_at: new Date().toISOString(), approved_by: auth.user.id }, context: { workflowOperation: 'approve' } })
  return Response.json({ lead })
}
