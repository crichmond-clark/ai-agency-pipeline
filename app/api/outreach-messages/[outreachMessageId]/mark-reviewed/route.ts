import config from '@payload-config'
import { getPayload, type PayloadRequest } from 'payload'

import { getOutreachReviewBlockReason } from '@/lib/workflow-guards'

export async function POST(request: Request, { params }: { params: Promise<{ outreachMessageId: string }> }) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ canSetHeaders: false, headers: request.headers, req: { payload } as PayloadRequest })
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { outreachMessageId } = await params
  const currentOutreach = await payload.findByID({ collection: 'outreach-messages', id: outreachMessageId, depth: 1 })
  const lead = typeof currentOutreach.lead === 'object' ? currentOutreach.lead : await payload.findByID({ collection: 'leads', id: currentOutreach.lead })
  const demoSite = typeof currentOutreach.demo_site === 'object'
    ? currentOutreach.demo_site
    : currentOutreach.demo_site
      ? await payload.findByID({ collection: 'demo-sites', id: currentOutreach.demo_site })
      : null
  const blocked = getOutreachReviewBlockReason({ lead, demoSite, outreach: currentOutreach })
  if (blocked) return Response.json({ error: blocked }, { status: 409 })

  const outreach = await payload.update({ collection: 'outreach-messages', id: outreachMessageId, data: { status: 'reviewed', reviewed_at: new Date().toISOString() } })
  return Response.json({ outreach_message: outreach })
}
